import { Logger } from '@aws-lambda-powertools/logger';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  createMealSchema,
  listQuerySchema,
  MEAL_SORTABLE,
  type MealIngredientInput,
  NUTRIENTS,
  type Nutrient,
  updateMealSchema,
} from '@bitewise/shared';
import { ulid } from 'ulidx';
import { ddb, TABLE_NAME } from '../lib/ddb';
import { type ApiResult, json, jsonBody, noContent, notFound } from '../lib/http';
import type { IngredientItem, MealItem } from '../lib/items';
import {
  batchGetOwned,
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

const memberIds = (members: MealIngredientInput[]) => members.map((member) => member.ingredientId);

/** Today's shape: Meal ingredients in position order, each with its Ingredient's name, nutrients and unit. */
function serialize(meal: MealItem, ingredients: Map<string, IngredientItem>) {
  return {
    id: meal.id,
    name: meal.name,
    mealIngredients: meal.ingredients.map(({ ingredientId, quantity }) => {
      const ingredient = ingredients.get(ingredientId);
      return {
        ingredientId,
        ingredientName: ingredient?.name,
        quantity,
        ...(Object.fromEntries(NUTRIENTS.map((n) => [n, ingredient?.[n]])) as Record<Nutrient, number>),
        unit: ingredient?.unit,
      };
    }),
  };
}

async function ingredientsById(owner: string, ids: string[]): Promise<Map<string, IngredientItem>> {
  const ingredients = await batchGetOwned<IngredientItem>(owner, 'ING', ids);
  return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
}

/** The Ingredients of these Meals, fetched once for all of them. */
function ingredientsOf(owner: string, meals: MealItem[]) {
  return ingredientsById(owner, meals.flatMap((meal) => memberIds(meal.ingredients)));
}

/** The Owner's Ingredients with these ids; any other id is a 404, like the EC2 app. */
async function requireIngredients(owner: string, ids: string[]): Promise<Map<string, IngredientItem>> {
  const found = await ingredientsById(owner, ids);
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) throw notFound(`No ingredient found with id ${missing.join(', ')}.`);
  return found;
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
  const ids = memberIds(members);
  const ingredients = await requireIngredients(owner, ids);

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
    ? await requireIngredients(owner, memberIds(members))
    : await ingredientsOf(owner, [current]);
  const before = new Set(memberIds(current.ingredients));
  const after = new Set(memberIds(members));
  const added = [...after].filter((ingredientId) => !before.has(ingredientId));
  const removed = [...before].filter((ingredientId) => !after.has(ingredientId));
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
      ...updateUsedBy(owner, 'ING', memberIds(current.ingredients), id, 'DELETE'),
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
