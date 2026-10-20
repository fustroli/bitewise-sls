import { beforeEach, describe, expect, test } from 'bun:test';
import { ConditionalCheckFailedException, TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type { Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import type { ApiEvent, ApiResult } from '../lib/http';

process.env.TABLE_NAME = 'bitewise-sls';
const ddb = mockClient(DynamoDBDocumentClient);
const { handler } = await import('./meals');

const OWNER = 'owner-sub';
const MEAL = '01JMEA1AAAAAAAAAAAAAAAAAAA';
const OATS = '01J0AT5AAAAAAAAAAAAAAAAAAA';
const MILK = '01JM11KAAAAAAAAAAAAAAAAAAA';
const HONEY = '01JH0NEYAAAAAAAAAAAAAAAAAA';

function request(method: string, path: string, options: { body?: unknown; query?: Record<string, string> } = {}) {
  const event = {
    rawPath: path,
    queryStringParameters: options.query,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    isBase64Encoded: false,
    requestContext: { http: { method }, authorizer: { jwt: { claims: { sub: OWNER } } } },
  } as unknown as ApiEvent;
  return (handler as (e: ApiEvent, c: Context) => Promise<ApiResult>)(event, {} as Context);
}

const body = (result: ApiResult) => JSON.parse(result.body as string);

const ingredient = (id: string, name: string) => ({
  PK: `USER#${OWNER}`,
  SK: `ING#${id}`,
  id,
  name,
  protein: 1,
  totalFat: 2,
  saturatedFat: 1,
  totalCarbohydrates: 3,
  sugar: 1,
  dietaryFiber: 1,
  calories: 50,
  unit: '100g',
});
const INGREDIENTS = [ingredient(OATS, 'Oats'), ingredient(MILK, 'Milk'), ingredient(HONEY, 'Honey')];

const meal = (overrides: Record<string, unknown> = {}) => ({
  PK: `USER#${OWNER}`,
  SK: `MEAL#${MEAL}`,
  id: MEAL,
  name: 'Porridge',
  ingredients: [
    { ingredientId: OATS, quantity: 0.5 },
    { ingredientId: MILK, quantity: 2 },
  ],
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
  ...overrides,
});

const porridge = {
  name: 'Porridge',
  mealIngredients: [
    { ingredientId: OATS, quantity: 0.504 },
    { ingredientId: MILK, quantity: 2 },
  ],
};

// BatchGet answers only the requested keys that exist
function ingredientsTable(items = INGREDIENTS) {
  ddb.on(BatchGetCommand).callsFake((input) => {
    const keys = Object.values(input.RequestItems)[0] as { Keys: { SK: string }[] };
    const wanted = new Set(keys.Keys.map((key) => key.SK));
    return { Responses: { 'bitewise-sls': items.filter((item) => wanted.has(item.SK)) } };
  });
}

const canceled = (...codes: string[]) =>
  new TransactionCanceledException({ message: 'canceled', $metadata: {}, CancellationReasons: codes.map((Code) => ({ Code })) });

const transactItems = (call = 0) => ddb.commandCalls(TransactWriteCommand)[call]!.args[0].input.TransactItems!;

describe('meals', () => {
  beforeEach(() => ddb.reset());

  describe('POST /api/meal', () => {
    test('creates the Meal, claims its name and marks each Ingredient as used', async () => {
      ingredientsTable();
      ddb.on(TransactWriteCommand).resolves({});
      const result = await request('POST', '/api/meal', { body: porridge });

      expect(result.statusCode).toBe(201);
      const [put, sentinel, ...used] = transactItems();
      expect(put!.Put!.Item).toMatchObject({ name: 'Porridge', ingredients: [{ ingredientId: OATS, quantity: 0.5 }, { ingredientId: MILK }] });
      expect(sentinel!.Put!.Item).toMatchObject({ SK: 'NAME#MEAL#porridge' });
      expect(used.map((item) => item.Update!.Key!.SK)).toEqual([`ING#${OATS}`, `ING#${MILK}`]);
      expect(used[0]!.Update!.UpdateExpression).toBe('ADD #usedBy :parent');
    });

    test('responds with Meal ingredients denormalized, in order', async () => {
      ingredientsTable();
      ddb.on(TransactWriteCommand).resolves({});
      const result = await request('POST', '/api/meal', { body: porridge });

      expect(body(result).mealIngredients).toEqual([
        expect.objectContaining({ ingredientId: OATS, ingredientName: 'Oats', quantity: 0.5, calories: 50, unit: '100g' }),
        expect.objectContaining({ ingredientId: MILK, ingredientName: 'Milk', quantity: 2 }),
      ]);
    });

    test('an Ingredient that is not the Owner’s is a 404 listing the ids', async () => {
      ingredientsTable([ingredient(OATS, 'Oats')]);
      const result = await request('POST', '/api/meal', { body: porridge });
      expect(body(result)).toMatchObject({ statusCode: 404, message: `No ingredient found with id ${MILK}.` });
      expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    });

    test('an Ingredient deleted meanwhile fails the transaction with a 404', async () => {
      ingredientsTable();
      ddb.on(TransactWriteCommand).rejects(canceled('None', 'None', 'None', 'ConditionalCheckFailed'));
      const result = await request('POST', '/api/meal', { body: porridge });
      expect(body(result).message).toBe(`No ingredient found with id ${MILK}.`);
    });

    test('a taken name is a 409', async () => {
      ingredientsTable();
      ddb.on(TransactWriteCommand).rejects(canceled('None', 'ConditionalCheckFailed', 'None', 'None'));
      const result = await request('POST', '/api/meal', { body: porridge });
      expect(body(result).message).toBe('You already have a meal named Porridge.');
    });

    test.each([
      [{ ...porridge, mealIngredients: [] }, 'Meal must have at least one ingredient'],
      [{ ...porridge, mealIngredients: [porridge.mealIngredients[0], porridge.mealIngredients[0]] }, 'Each ingredient may appear only once in a meal'],
      [{ ...porridge, mealIngredients: [{ ingredientId: OATS, quantity: 0 }] }, 'mealIngredients.0.quantity must be a positive number'],
      [{ ...porridge, mealIngredients: [{ ingredientId: 7, quantity: 1 }] }, 'mealIngredients.0.ingredientId must be a ULID'],
      [{ ...porridge, mealIngredients: [{ ingredientId: OATS, quantity: 1, position: 0 }] }, 'mealIngredients.0.property position should not exist'],
    ])('validation: %#', async (input, message) => {
      const result = await request('POST', '/api/meal', { body: input });
      expect(result.statusCode).toBe(400);
      expect(body(result).message).toContain(message);
    });

    test('at most 48 Meal ingredients (one transaction)', async () => {
      const many = Array.from({ length: 49 }, (_, i) => ({ ingredientId: `01J${String(i).padStart(23, '0')}`, quantity: 1 }));
      const result = await request('POST', '/api/meal', { body: { name: 'Feast', mealIngredients: many } });
      expect(body(result).message).toContain('Meal must have at most 48 ingredients');
    });
  });

  describe('PATCH /api/meal/:id', () => {
    test('replaces the Meal ingredients, updating usedBy only for added and removed ones', async () => {
      ddb.on(GetCommand).resolves({ Item: meal() });
      ingredientsTable();
      ddb.on(TransactWriteCommand).resolves({});
      const result = await request('PATCH', `/api/meal/${MEAL}`, {
        body: { mealIngredients: [{ ingredientId: HONEY, quantity: 1 }, { ingredientId: OATS, quantity: 1 }] },
      });

      expect(body(result).mealIngredients.map((m: { ingredientName: string }) => m.ingredientName)).toEqual(['Honey', 'Oats']);
      const [change, add, remove] = transactItems();
      expect(change!.Update!.ConditionExpression).toBe('attribute_exists(PK) AND #updatedAt = :prev');
      expect(add!.Update).toMatchObject({ Key: { SK: `ING#${HONEY}` }, UpdateExpression: 'ADD #usedBy :parent' });
      expect(remove!.Update).toMatchObject({ Key: { SK: `ING#${MILK}` }, UpdateExpression: 'DELETE #usedBy :parent' });
    });

    test('only quantities or order changed: a single conditional update', async () => {
      ddb.on(GetCommand).resolves({ Item: meal() });
      ingredientsTable();
      ddb.on(UpdateCommand).resolves({});
      await request('PATCH', `/api/meal/${MEAL}`, {
        body: { mealIngredients: [{ ingredientId: MILK, quantity: 1 }, { ingredientId: OATS, quantity: 1 }] },
      });
      expect(ddb.commandCalls(UpdateCommand)).toHaveLength(1);
      expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    });

    test('a rename onto a taken name is a 409', async () => {
      ddb.on(GetCommand).resolves({ Item: meal() });
      ingredientsTable();
      ddb.on(TransactWriteCommand).rejects(canceled('None', 'None', 'ConditionalCheckFailed'));
      const result = await request('PATCH', `/api/meal/${MEAL}`, { body: { name: 'Oatmeal' } });
      expect(body(result).message).toBe('You already have a meal named Oatmeal.');
    });

    test('changed by someone else meanwhile: redone once from a fresh read', async () => {
      ddb.on(GetCommand).resolves({ Item: meal() });
      ingredientsTable();
      ddb
        .on(UpdateCommand)
        .rejectsOnce(new ConditionalCheckFailedException({ message: 'changed', $metadata: {} }))
        .resolves({});
      const result = await request('PATCH', `/api/meal/${MEAL}`, { body: { name: 'PORRIDGE' } });

      expect(result.statusCode).toBe(200);
      expect(ddb.commandCalls(GetCommand)).toHaveLength(2);
    });

    test('a missing Meal is a 404', async () => {
      ddb.on(GetCommand).resolves({});
      const result = await request('PATCH', `/api/meal/${MEAL}`, { body: { name: 'Oatmeal' } });
      expect(body(result).message).toBe('No meal found with the provided id.');
    });
  });

  describe('DELETE /api/meal/:id', () => {
    test('deletes the Meal and its sentinel and unmarks its Ingredients', async () => {
      ddb.on(GetCommand).resolves({ Item: meal() });
      ddb.on(TransactWriteCommand).resolves({});
      const result = await request('DELETE', `/api/meal/${MEAL}`);

      expect(result.statusCode).toBe(204);
      const [own, sentinel, ...unused] = transactItems();
      expect(own!.Delete!.ConditionExpression).toContain('attribute_not_exists(usedBy)');
      expect(sentinel!.Delete!.Key).toMatchObject({ SK: 'NAME#MEAL#porridge' });
      expect(unused.map((item) => item.Update!.UpdateExpression)).toEqual(['DELETE #usedBy :parent', 'DELETE #usedBy :parent']);
    });

    test('409 naming the Meal plans that contain it', async () => {
      ddb.on(GetCommand).resolves({ Item: meal({ usedBy: new Set(['01JP1ANAAAAAAAAAAAAAAAAAAA']) }) });
      ddb.on(BatchGetCommand).resolves({ Responses: { 'bitewise-sls': [{ id: '01JP1ANAAAAAAAAAAAAAAAAAAA', name: 'Week 1' }] } });
      const result = await request('DELETE', `/api/meal/${MEAL}`);
      expect(body(result).message).toBe('This meal is in meal plans: Week 1.');
    });
  });

  test('GET /api/meal/:id returns the Meal with its Meal ingredients', async () => {
    ddb.on(GetCommand).resolves({ Item: meal() });
    ingredientsTable();
    const result = await request('GET', `/api/meal/${MEAL}`);
    expect(body(result)).toMatchObject({ id: MEAL, name: 'Porridge', mealIngredients: [{ ingredientName: 'Oats' }, { ingredientName: 'Milk' }] });
  });

  test('GET /api/meal pages, then fetches Ingredients only for that page', async () => {
    const other = meal({ id: '01JMEA1BBBBBBBBBBBBBBBBBBB', name: 'Toast', ingredients: [{ ingredientId: HONEY, quantity: 1 }] });
    ddb.on(QueryCommand).resolves({ Items: [meal(), other] });
    ingredientsTable();
    const result = await request('GET', '/api/meal', { query: { orderBy: 'name', orderDirection: 'desc', limit: '1' } });

    expect(body(result)).toMatchObject({ count: 2, data: [{ name: 'Toast', mealIngredients: [{ ingredientName: 'Honey' }] }] });
    const keys = ddb.commandCalls(BatchGetCommand)[0]!.args[0].input.RequestItems!['bitewise-sls']!.Keys!;
    expect(keys).toEqual([{ PK: `USER#${OWNER}`, SK: `ING#${HONEY}` }]);
  });

  test('GET /api/meal/options returns id and name by name', async () => {
    ddb.on(QueryCommand).resolves({ Items: [{ id: MEAL, name: 'b' }, { id: '01JMEA1BBBBBBBBBBBBBBBBBBB', name: 'A' }] });
    const result = await request('GET', '/api/meal/options');
    expect(body(result)).toEqual([
      { id: '01JMEA1BBBBBBBBBBBBBBBBBBB', name: 'A' },
      { id: MEAL, name: 'b' },
    ]);
  });
});
