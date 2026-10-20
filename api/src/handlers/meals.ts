import { Logger } from '@aws-lambda-powertools/logger';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  createMealSchema,
  listQuerySchema,
  MEAL_SORTABLE,
  type MealIngredientInput,
  updateMealSchema,
} from '@bitewise/shared';
import { ulid } from 'ulidx';
import { ddb, TABLE_NAME } from '../lib/ddb';
import { type ApiResult, json, jsonBody, noContent, notFound } from '../lib/http';
import type { IngredientItem, MealItem } from '../lib/items';
import { ingredientIds, ingredientsOf, serializeMeal as serialize } from '../lib/meal-view';
import {
  batchGetOwned,
  requireAllOwned,
  cancellationReasons,
  getOwned,
  itemKey,
  listPage,
  nameKey,
  ownerKey,
  queryAll,
  sortItems,
  TIMESTAMP_SORT_FIELDS,
} from '../lib/owned';
import { type Request, router } from '../lib/router';
import { parse, parseId } from '../lib/validation';
import {
  assertUnused,
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

const logger = new Logger({ serviceName: 'meals' });
const LABEL = 'meal';

const listQuery = listQuerySchema(MEAL_SORTABLE);
const SORT_FIELD: Record<(typeof MEAL_SORTABLE)[number], keyof MealItem> = { name: 'name', ...TIMESTAMP_SORT_FIELDS };

/** The EC2 app stored quantities as decimal(10,2). */
function roundQuantities(members: MealIngredientInput[]): MealIngredientInput[] {
  return members.map(({ ingredientId, quantity }) => ({ ingredientId, quantity: Math.round(quantity * 100) / 100 }));
}

async function list({ event, owner }: Request) {
  const query = parse(listQuery, event.queryStringParameters ?? {});
  const meals = query.ids ? await batchGetOwned<MealItem>(owner, 'MEAL', query.ids) : await queryAll<MealItem>(owner, 'MEAL');
  const sortField = query.orderBy && SORT_FIELD[query.orderBy];
  const page = listPage(meals, { ...query, sortBy: sortField ? (meal) => meal[sortField] : undefined });
  const ingredients = await ingredientsOf(owner, page.data);
  return json(200, { data: page.data.map((meal) => serialize(meal, ingredients)), count: page.count });
}

async function options({ owner }: Request) {
  const meals = await queryAll<{ id: string; name: string }>(owner, 'MEAL', ['id', 'name']);
  return json(
    200,
    sortItems(meals, (meal) => meal.name).map(({ id, name }) => ({ id, name })),
  );
}

async function getOne({ owner, params }: Request) {
  const meal = await getOwned<MealItem>(owner, 'MEAL', parseId(params.id), LABEL);
  return json(200, serialize(meal, await ingredientsOf(owner, [meal])));
}

async function create({ event, owner }: Request) {
  const data = parse(createMealSchema, jsonBody(event));
  const members = roundQuantities(data.mealIngredients);
  const ids = members.map((member) => member.ingredientId);
  const ingredients = await requireAllOwned<IngredientItem>(owner, 'ING', ids, 'ingredient');

  const now = new Date().toISOString();
  const id = ulid();
  const meal: MealItem = {
    PK: ownerKey(owner),
    SK: itemKey('MEAL', id),
    id,
    name: data.name,
    ingredients: members,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await transact([putNew(meal), claimName(owner, 'MEAL', data.name, id), ...updateUsedBy(owner, 'ING', ids, id, 'ADD')]);
  } catch (error) {
    const reasons = cancellationReasons(error);
    if (reasons?.[1] === 'ConditionalCheckFailed') throw nameTaken(LABEL, data.name);
    // An Ingredient was deleted after the check above
    const gone = ids.filter((_, i) => reasons?.[i + 2] === 'ConditionalCheckFailed');
    if (gone.length) throw notFound(`No ingredient found with id ${gone.join(', ')}.`);
    throw error;
  }
  return json(201, serialize(meal, ingredients));
}

async function update({ event, owner, params }: Request, retried = false): Promise<ApiResult> {
  const id = parseId(params.id);
  const patch = parse(updateMealSchema, jsonBody(event));
  const current = await getOwned<MealItem>(owner, 'MEAL', id, LABEL);
  if (patch.name === undefined && patch.mealIngredients === undefined) {
    return json(200, serialize(current, await ingredientsOf(owner, [current])));
  }

  const members = patch.mealIngredients ? roundQuantities(patch.mealIngredients) : current.ingredients;
  const ingredients = patch.mealIngredients
    ? await requireAllOwned<IngredientItem>(owner, 'ING', ingredientIds({ ingredients: members }), 'ingredient')
    : await ingredientsOf(owner, [current]);
  const { added, removed } = memberChanges(ingredientIds(current), ingredientIds({ ingredients: members }));
  const renamed = patch.name !== undefined && nameKey(patch.name) !== nameKey(current.name);

  const now = new Date().toISOString();
  // Conditional on updatedAt: added/removed are computed from what was read
  const change = setFields(current, { name: patch.name, ingredients: patch.mealIngredients && members }, now, current.updatedAt);
  const items: TransactItem[] = [
    { Update: change },
    ...(renamed ? [releaseName(owner, 'MEAL', current.name), claimName(owner, 'MEAL', patch.name!, id)] : []),
    ...updateUsedBy(owner, 'ING', added, id, 'ADD'),
    ...updateUsedBy(owner, 'ING', removed, id, 'DELETE'),
  ];
  const firstAdded = renamed ? 3 : 1;

  try {
    if (items.length === 1) await ddb.send(new UpdateCommand(change));
    else await transact(items);
  } catch (error) {
    const reasons = cancellationReasons(error);
    if (renamed && reasons?.[2] === 'ConditionalCheckFailed') throw nameTaken(LABEL, patch.name!);
    const gone = added.filter((_, i) => reasons?.[firstAdded + i] === 'ConditionalCheckFailed');
    if (gone.length) throw notFound(`No ingredient found with id ${gone.join(', ')}.`);
    // Changed or deleted since the read: redo it once from a fresh read (404 if it's gone)
    if ((reasons?.[0] === 'ConditionalCheckFailed' || error instanceof ConditionalCheckFailedException) && !retried) {
      return update({ event, owner, params }, true);
    }
    throw error;
  }
  return json(200, serialize({ ...current, name: patch.name ?? current.name, ingredients: members, updatedAt: now }, ingredients));
}

async function remove({ owner, params }: Request) {
  await removeOwned(owner, parseId(params.id));
  return noContent();
}

async function removeOwned(owner: string, id: string, retried = false): Promise<void> {
  const current = await getOwned<MealItem>(owner, 'MEAL', id, LABEL);
  await assertUnused(owner, current, 'PLAN', 'This meal is in meal plans:');

  try {
    await transact([
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: { PK: current.PK, SK: current.SK },
          // Unchanged since the read, and in no Meal plan
          ConditionExpression: 'attribute_exists(PK) AND attribute_not_exists(usedBy) AND #updatedAt = :prev',
          ExpressionAttributeNames: { '#updatedAt': 'updatedAt' },
          ExpressionAttributeValues: { ':prev': current.updatedAt },
        },
      },
      releaseName(owner, 'MEAL', current.name),
      ...updateUsedBy(owner, 'ING', ingredientIds(current), id, 'DELETE'),
    ]);
  } catch (error) {
    if (cancellationReasons(error)?.[0] === 'ConditionalCheckFailed' && !retried) return removeOwned(owner, id, true);
    throw error;
  }
}

export const handler = router(
  {
    'GET /api/meal': list,
    'GET /api/meal/options': options,
    'GET /api/meal/:id': getOne,
    'POST /api/meal': create,
    'PATCH /api/meal/:id': (request) => update(request),
    'DELETE /api/meal/:id': remove,
  },
  logger,
);
