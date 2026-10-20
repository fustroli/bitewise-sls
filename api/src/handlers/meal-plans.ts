import { Logger } from '@aws-lambda-powertools/logger';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { createMealPlanSchema, listQuerySchema, MEAL_PLAN_SORTABLE, updateMealPlanSchema } from '@bitewise/shared';
import { ulid } from 'ulidx';
import { ddb, TABLE_NAME } from '../lib/ddb';
import { type ApiResult, json, jsonBody, noContent, notFound } from '../lib/http';
import type { MealItem, MealPlanItem } from '../lib/items';
import { ingredientsOf, serializeMeal } from '../lib/meal-view';
import {
  batchGetOwned,
  cancellationReasons,
  getOwned,
  itemKey,
  listPage,
  mapById,
  nameKey,
  ownerKey,
  queryAll,
  requireAllOwned,
  sortItems,
  TIMESTAMP_SORT_FIELDS,
} from '../lib/owned';
import { type Request, router } from '../lib/router';
import { parse, parseId } from '../lib/validation';
import {
  claimName,
  memberChanges,
  nameTaken,
  putNew,
  releaseName,
  setFields,
  type TransactItem,
  transact,
  updateUsedBy,
} from '../lib/writes';

const logger = new Logger({ serviceName: 'meal-plans' });
const LABEL = 'meal plan';

const listQuery = listQuerySchema(MEAL_PLAN_SORTABLE);
const SORT_FIELD: Record<(typeof MEAL_PLAN_SORTABLE)[number], keyof MealPlanItem> = { name: 'name', ...TIMESTAMP_SORT_FIELDS };

/**
 * Today's shape: `{ id, name, meals }`, each Meal in full with its Meal ingredients. Fetches all
 * Meals of all plans in one batch, then all their Ingredients in another.
 */
async function serializePlans(owner: string, plans: MealPlanItem[], known?: Map<string, MealItem>) {
  const meals = known ?? (await mapById<MealItem>(owner, 'MEAL', plans.flatMap((plan) => plan.mealIds)));
  const ingredients = await ingredientsOf(owner, [...meals.values()]);
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    meals: plan.mealIds.flatMap((mealId) => {
      const meal = meals.get(mealId);
      return meal ? [serializeMeal(meal, ingredients)] : [];
    }),
  }));
}

async function serializePlan(owner: string, plan: MealPlanItem, meals?: Map<string, MealItem>) {
  const [serialized] = await serializePlans(owner, [plan], meals);
  return serialized;
}

async function list({ event, owner }: Request) {
  const query = parse(listQuery, event.queryStringParameters ?? {});
  const plans = query.ids
    ? await batchGetOwned<MealPlanItem>(owner, 'PLAN', query.ids)
    : await queryAll<MealPlanItem>(owner, 'PLAN');
  const sortField = query.orderBy && SORT_FIELD[query.orderBy];
  const page = listPage(plans, { ...query, sortBy: sortField ? (plan) => plan[sortField] : undefined });
  return json(200, { data: await serializePlans(owner, page.data), count: page.count });
}

/** What a picker needs to offer a Meal plan, and to load its Meals. */
async function options({ owner }: Request) {
  const plans = await queryAll<Pick<MealPlanItem, 'id' | 'name' | 'mealIds'>>(owner, 'PLAN', ['id', 'name', 'mealIds']);
  return json(
    200,
    sortItems(plans, (plan) => plan.name).map(({ id, name, mealIds }) => ({ id, name, mealIds })),
  );
}

async function getOne({ owner, params }: Request) {
  const plan = await getOwned<MealPlanItem>(owner, 'PLAN', parseId(params.id), LABEL);
  return json(200, await serializePlan(owner, plan));
}

async function create({ event, owner }: Request) {
  const data = parse(createMealPlanSchema, jsonBody(event));
  const meals = await requireAllOwned<MealItem>(owner, 'MEAL', data.mealIds, 'meal');

  const now = new Date().toISOString();
  const id = ulid();
  const plan: MealPlanItem = {
    PK: ownerKey(owner),
    SK: itemKey('PLAN', id),
    id,
    name: data.name,
    mealIds: data.mealIds,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await transact([putNew(plan), claimName(owner, 'PLAN', data.name, id), ...updateUsedBy(owner, 'MEAL', data.mealIds, id, 'ADD')]);
  } catch (error) {
    const reasons = cancellationReasons(error);
    if (reasons?.[1] === 'ConditionalCheckFailed') throw nameTaken(LABEL, data.name);
    // A Meal was deleted after the check above
    const gone = data.mealIds.filter((_, i) => reasons?.[i + 2] === 'ConditionalCheckFailed');
    if (gone.length) throw notFound(`No meal found with id ${gone.join(', ')}.`);
    throw error;
  }
  return json(201, await serializePlan(owner, plan, meals));
}

async function update({ event, owner, params }: Request, retried = false): Promise<ApiResult> {
  const id = parseId(params.id);
  const patch = parse(updateMealPlanSchema, jsonBody(event));
  const current = await getOwned<MealPlanItem>(owner, 'PLAN', id, LABEL);
  if (patch.name === undefined && patch.mealIds === undefined) return json(200, await serializePlan(owner, current));

  const mealIds = patch.mealIds ?? current.mealIds;
  const meals = patch.mealIds ? await requireAllOwned<MealItem>(owner, 'MEAL', mealIds, 'meal') : undefined;
  const { added, removed } = memberChanges(current.mealIds, mealIds);
  const renamed = patch.name !== undefined && nameKey(patch.name) !== nameKey(current.name);

  const now = new Date().toISOString();
  // Conditional on updatedAt: added/removed are computed from what was read
  const change = setFields(current, { name: patch.name, mealIds: patch.mealIds }, now, current.updatedAt);
  const items: TransactItem[] = [
    { Update: change },
    ...(renamed ? [releaseName(owner, 'PLAN', current.name), claimName(owner, 'PLAN', patch.name!, id)] : []),
    ...updateUsedBy(owner, 'MEAL', added, id, 'ADD'),
    ...updateUsedBy(owner, 'MEAL', removed, id, 'DELETE'),
  ];
  const firstAdded = renamed ? 3 : 1;

  try {
    if (items.length === 1) await ddb.send(new UpdateCommand(change));
    else await transact(items);
  } catch (error) {
    const reasons = cancellationReasons(error);
    if (renamed && reasons?.[2] === 'ConditionalCheckFailed') throw nameTaken(LABEL, patch.name!);
    const gone = added.filter((_, i) => reasons?.[firstAdded + i] === 'ConditionalCheckFailed');
    if (gone.length) throw notFound(`No meal found with id ${gone.join(', ')}.`);
    // Changed or deleted since the read: redo it once from a fresh read (404 if it's gone)
    if ((reasons?.[0] === 'ConditionalCheckFailed' || error instanceof ConditionalCheckFailedException) && !retried) {
      return update({ event, owner, params }, true);
    }
    throw error;
  }
  const updated = { ...current, name: patch.name ?? current.name, mealIds, updatedAt: now };
  return json(200, await serializePlan(owner, updated, meals));
}

/** Nothing contains a Meal plan, so there's no in-use check. */
async function remove({ owner, params }: Request) {
  await removeOwned(owner, parseId(params.id));
  return noContent();
}

async function removeOwned(owner: string, id: string, retried = false): Promise<void> {
  const current = await getOwned<MealPlanItem>(owner, 'PLAN', id, LABEL);
  try {
    await transact([
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: { PK: current.PK, SK: current.SK },
          // Unchanged since the read, so the Meals unmarked below are its Meals
          ConditionExpression: 'attribute_exists(PK) AND #updatedAt = :prev',
          ExpressionAttributeNames: { '#updatedAt': 'updatedAt' },
          ExpressionAttributeValues: { ':prev': current.updatedAt },
        },
      },
      releaseName(owner, 'PLAN', current.name),
      ...updateUsedBy(owner, 'MEAL', current.mealIds, id, 'DELETE'),
    ]);
  } catch (error) {
    if (cancellationReasons(error)?.[0] === 'ConditionalCheckFailed' && !retried) return removeOwned(owner, id, true);
    throw error;
  }
}

export const handler = router(
  {
    'GET /api/meal-plan': list,
    'GET /api/meal-plan/options': options,
    'GET /api/meal-plan/:id': getOne,
    'POST /api/meal-plan': create,
    'PATCH /api/meal-plan/:id': (request) => update(request),
    'DELETE /api/meal-plan/:id': remove,
  },
  logger,
);
