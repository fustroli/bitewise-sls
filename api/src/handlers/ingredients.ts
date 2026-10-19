import { Logger } from '@aws-lambda-powertools/logger';
import { TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import {
  createIngredientSchema,
  FAT_MESSAGE,
  fatIsConsistent,
  INGREDIENT_SORTABLE,
  listQuerySchema,
  NUTRIENTS,
  type Nutrient,
  type Unit,
  updateIngredientSchema,
} from '@bitewise/shared';
import { ulid } from 'ulidx';
import { ddb, TABLE_NAME } from '../lib/ddb';
import { badRequest, conflict, json, jsonBody, noContent } from '../lib/http';
import {
  batchGetOwned,
  cancellationReasons,
  getOwned,
  itemKey,
  listPage,
  nameKey,
  nameSentinelKey,
  type OwnedItem,
  ownerKey,
  queryAll,
  sortItems,
} from '../lib/owned';
import { type Request, router } from '../lib/router';
import { parse, parseId } from '../lib/validation';

const logger = new Logger({ serviceName: 'ingredients' });
const LABEL = 'ingredient';

type IngredientItem = OwnedItem & Record<Nutrient, number> & { unit: Unit };

const listQuery = listQuerySchema(INGREDIENT_SORTABLE);

// Response field names stay the EC2 app's; items store createdAt/updatedAt.
const SORT_FIELD: Record<(typeof INGREDIENT_SORTABLE)[number], keyof IngredientItem> = {
  ...(Object.fromEntries(NUTRIENTS.map((n) => [n, n])) as Record<Nutrient, Nutrient>),
  name: 'name',
  unit: 'unit',
  createTimeStamp: 'createdAt',
  updateTimeStamp: 'updatedAt',
};

/** The EC2 app stored nutrients as decimal(10,1). */
function roundNutrients<T extends Partial<Record<Nutrient, number>>>(values: T): T {
  const rounded = { ...values };
  for (const n of NUTRIENTS) if (rounded[n] !== undefined) rounded[n] = Math.round(rounded[n]! * 10) / 10;
  return rounded;
}

function serialize(item: IngredientItem, owner: string) {
  return {
    id: item.id,
    name: item.name,
    ...(Object.fromEntries(NUTRIENTS.map((n) => [n, item[n]])) as Record<Nutrient, number>),
    unit: item.unit,
    userId: owner,
    createTimeStamp: item.createdAt,
    updateTimeStamp: item.updatedAt,
    // Deletes are hard now; kept for the response shape
    deleteTimeStamp: null,
  };
}

async function list({ event, owner }: Request) {
  const query = parse(listQuery, event.queryStringParameters ?? {});
  const items = query.ids
    ? await batchGetOwned<IngredientItem>(owner, 'ING', query.ids)
    : await queryAll<IngredientItem>(owner, 'ING');
  const sortField = query.orderBy && SORT_FIELD[query.orderBy];
  const page = listPage(items, { ...query, sortBy: sortField ? (item) => item[sortField] : undefined });
  return json(200, { data: page.data.map((item) => serialize(item, owner)), count: page.count });
}

async function options({ owner }: Request) {
  const items = await queryAll<Pick<IngredientItem, 'id' | 'name' | 'unit'>>(owner, 'ING', ['id', 'name', 'unit']);
  return json(
    200,
    sortItems(items, (item) => item.name).map(({ id, name, unit }) => ({ id, name, unit })),
  );
}

async function create({ event, owner }: Request) {
  const data = roundNutrients(parse(createIngredientSchema, jsonBody(event)));
  const now = new Date().toISOString();
  const id = ulid();
  const item: IngredientItem = { PK: ownerKey(owner), SK: itemKey('ING', id), id, ...data, createdAt: now, updatedAt: now };

  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: TABLE_NAME, Item: item, ConditionExpression: 'attribute_not_exists(PK)' } },
          {
            Put: {
              TableName: TABLE_NAME,
              Item: { PK: item.PK, SK: nameSentinelKey('ING', data.name), id },
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
        ],
      }),
    );
  } catch (error) {
    if (cancellationReasons(error)?.[1] === 'ConditionalCheckFailed') throw duplicateName(data.name);
    throw error;
  }
  return json(201, serialize(item, owner));
}

async function update({ event, owner, params }: Request) {
  const id = parseId(params.id);
  const patch = roundNutrients(parse(updateIngredientSchema, jsonBody(event)));
  const current = await getOwned<IngredientItem>(owner, 'ING', id, LABEL);
  // Checked on the merged Ingredient: a PATCH may send only one of the two
  const merged: IngredientItem = { ...current, ...patch };
  if (!fatIsConsistent(merged)) throw badRequest([FAT_MESSAGE]);

  const fields = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (!fields.length) return json(200, serialize(current, owner));

  const now = new Date().toISOString();
  // SET only the sent fields: a concurrent Meal write may be changing usedBy.
  const change = {
    TableName: TABLE_NAME,
    Key: { PK: current.PK, SK: current.SK },
    UpdateExpression: `SET ${[...fields.map((_, i) => `#f${i} = :v${i}`), '#updatedAt = :now'].join(', ')}`,
    ConditionExpression: 'attribute_exists(PK)',
    ExpressionAttributeNames: {
      ...Object.fromEntries(fields.map(([key], i) => [`#f${i}`, key])),
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: { ...Object.fromEntries(fields.map(([, value], i) => [`:v${i}`, value])), ':now': now },
  };

  const renamed = patch.name !== undefined && nameKey(patch.name) !== nameKey(current.name);
  try {
    if (renamed) {
      await ddb.send(
        new TransactWriteCommand({
          TransactItems: [
            { Update: change },
            { Delete: { TableName: TABLE_NAME, Key: { PK: current.PK, SK: nameSentinelKey('ING', current.name) } } },
            {
              Put: {
                TableName: TABLE_NAME,
                Item: { PK: current.PK, SK: nameSentinelKey('ING', patch.name!), id },
                ConditionExpression: 'attribute_not_exists(PK)',
              },
            },
          ],
        }),
      );
    } else {
      await ddb.send(new UpdateCommand(change));
    }
  } catch (error) {
    const reasons = cancellationReasons(error);
    if (reasons?.[2] === 'ConditionalCheckFailed') throw duplicateName(patch.name!);
    // Deleted between the read and the write
    if (reasons?.[0] === 'ConditionalCheckFailed' || error instanceof ConditionalCheckFailedException) {
      return update({ event, owner, params });
    }
    throw error;
  }
  return json(200, serialize({ ...merged, updatedAt: now }, owner));
}

async function remove({ owner, params }: Request) {
  await removeOwned(owner, parseId(params.id));
  return noContent();
}

async function removeOwned(owner: string, id: string, retried = false): Promise<void> {
  const current = await getOwned<IngredientItem>(owner, 'ING', id, LABEL);
  await assertUnused(owner, current);

  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: TABLE_NAME,
              Key: { PK: current.PK, SK: current.SK },
              // An empty set is removed from the item, so "no usedBy" means no Meal uses it.
              ConditionExpression: 'attribute_exists(PK) AND attribute_not_exists(usedBy)',
            },
          },
          { Delete: { TableName: TABLE_NAME, Key: { PK: current.PK, SK: nameSentinelKey('ING', current.name) } } },
        ],
      }),
    );
  } catch (error) {
    // A Meal started using it (or it was deleted) after the read: answer from a fresh read
    if (cancellationReasons(error)?.[0] === 'ConditionalCheckFailed' && !retried) {
      return removeOwned(owner, id, true);
    }
    throw error;
  }
}

/** 409 while any Meal uses the Ingredient. */
async function assertUnused(owner: string, ingredient: IngredientItem): Promise<void> {
  if (!ingredient.usedBy?.size) return;
  const meals = await batchGetOwned<{ id: string; name: string }>(owner, 'MEAL', [...ingredient.usedBy], ['id', 'name']);
  const names = sortItems(meals, (meal) => meal.id).map((meal) => meal.name);
  throw conflict(`This ingredient is used in meals: ${names.join(', ')}.`);
}

function duplicateName(name: string) {
  return conflict(`You already have an ingredient named ${name}.`);
}

export const handler = router(
  {
    'GET /api/ingredient': list,
    'GET /api/ingredient/options': options,
    'POST /api/ingredient': create,
    'PATCH /api/ingredient/:id': update,
    'DELETE /api/ingredient/:id': remove,
  },
  logger,
);
