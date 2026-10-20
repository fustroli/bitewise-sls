import { beforeEach, describe, expect, test } from 'bun:test';
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
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
const { handler } = await import('./meal-plans');

const OWNER = 'owner-sub';
const PLAN = '01JP1ANAAAAAAAAAAAAAAAAAAA';
const BREAKFAST = '01JBREAKAAAAAAAAAAAAAAAAAA';
const LUNCH = '01JM1DDAYAAAAAAAAAAAAAAAAA';
const DINNER = '01JD1NNERAAAAAAAAAAAAAAAAA';
const OATS = '01J0AT5AAAAAAAAAAAAAAAAAAA';

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

const meal = (id: string, name: string) => ({
  PK: `USER#${OWNER}`,
  SK: `MEAL#${id}`,
  id,
  name,
  ingredients: [{ ingredientId: OATS, quantity: 1 }],
});
const oats = { PK: `USER#${OWNER}`, SK: `ING#${OATS}`, id: OATS, name: 'Oats', calories: 380, unit: '100g' };
const TABLE = [meal(BREAKFAST, 'Porridge'), meal(LUNCH, 'Salad'), meal(DINNER, 'Soup'), oats];

const plan = (overrides: Record<string, unknown> = {}) => ({
  PK: `USER#${OWNER}`,
  SK: `PLAN#${PLAN}`,
  id: PLAN,
  name: 'Week 1',
  mealIds: [BREAKFAST, LUNCH],
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
  ...overrides,
});

// BatchGet answers only the requested keys that exist
function table(items: Record<string, unknown>[] = TABLE) {
  ddb.on(BatchGetCommand).callsFake((input) => {
    const keys = Object.values(input.RequestItems)[0] as { Keys: { SK: string }[] };
    const wanted = new Set(keys.Keys.map((key) => key.SK));
    return { Responses: { 'bitewise-sls': items.filter((item) => wanted.has(item.SK as string)) } };
  });
}

const canceled = (...codes: string[]) =>
  new TransactionCanceledException({ message: 'canceled', $metadata: {}, CancellationReasons: codes.map((Code) => ({ Code })) });

const transactItems = () => ddb.commandCalls(TransactWriteCommand)[0]!.args[0].input.TransactItems!;

describe('meal plans', () => {
  beforeEach(() => ddb.reset());

  describe('POST /api/meal-plan', () => {
    test('creates the plan, claims its name and marks each Meal as used', async () => {
      table();
      ddb.on(TransactWriteCommand).resolves({});
      const result = await request('POST', '/api/meal-plan', { body: { name: 'Week 1', mealIds: [LUNCH, BREAKFAST] } });

      expect(result.statusCode).toBe(201);
      expect(body(result)).toMatchObject({
        name: 'Week 1',
        meals: [{ id: LUNCH, name: 'Salad', mealIngredients: [{ ingredientName: 'Oats', calories: 380 }] }, { id: BREAKFAST }],
      });
      const [, sentinel, ...used] = transactItems();
      expect(sentinel!.Put!.Item).toMatchObject({ SK: 'NAME#PLAN#week 1' });
      expect(used.map((item) => item.Update!.Key!.SK)).toEqual([`MEAL#${LUNCH}`, `MEAL#${BREAKFAST}`]);
    });

    test('an unknown Meal is a 404', async () => {
      table([meal(BREAKFAST, 'Porridge')]);
      const result = await request('POST', '/api/meal-plan', { body: { name: 'Week 1', mealIds: [BREAKFAST, DINNER] } });
      expect(body(result).message).toBe(`No meal found with id ${DINNER}.`);
    });

    test('a taken name is a 409', async () => {
      table();
      ddb.on(TransactWriteCommand).rejects(canceled('None', 'ConditionalCheckFailed', 'None'));
      const result = await request('POST', '/api/meal-plan', { body: { name: 'Week 1', mealIds: [BREAKFAST] } });
      expect(body(result).message).toBe('You already have a meal plan named Week 1.');
    });

    test.each([
      [{ name: 'Week 1', mealIds: [] }, 'Meal plan must have at least one meal'],
      [{ name: 'Week 1', mealIds: [BREAKFAST, BREAKFAST] }, 'Each meal may appear only once in a meal plan'],
      [{ name: 'Week 1', mealIds: ['7'] }, 'each value in mealIds must be a ULID'],
    ])('validation: %#', async (input, message) => {
      const result = await request('POST', '/api/meal-plan', { body: input });
      expect(body(result).message).toContain(message);
    });
  });

  describe('PATCH /api/meal-plan/:id', () => {
    test('replaces the Meals, updating usedBy only for added and removed ones', async () => {
      ddb.on(GetCommand).resolves({ Item: plan() });
      table();
      ddb.on(TransactWriteCommand).resolves({});
      const result = await request('PATCH', `/api/meal-plan/${PLAN}`, { body: { mealIds: [DINNER, BREAKFAST] } });

      expect(body(result).meals.map((m: { name: string }) => m.name)).toEqual(['Soup', 'Porridge']);
      const [change, add, remove] = transactItems();
      expect(change!.Update!.ConditionExpression).toBe('attribute_exists(PK) AND #updatedAt = :prev');
      expect(add!.Update).toMatchObject({ Key: { SK: `MEAL#${DINNER}` }, UpdateExpression: 'ADD #usedBy :parent' });
      expect(remove!.Update).toMatchObject({ Key: { SK: `MEAL#${LUNCH}` }, UpdateExpression: 'DELETE #usedBy :parent' });
    });

    test('a reorder is a single conditional update', async () => {
      ddb.on(GetCommand).resolves({ Item: plan() });
      table();
      ddb.on(UpdateCommand).resolves({});
      await request('PATCH', `/api/meal-plan/${PLAN}`, { body: { mealIds: [LUNCH, BREAKFAST] } });
      expect(ddb.commandCalls(UpdateCommand)).toHaveLength(1);
      expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    });
  });

  test('DELETE unmarks its Meals, with no in-use check', async () => {
    ddb.on(GetCommand).resolves({ Item: plan({ usedBy: undefined }) });
    ddb.on(TransactWriteCommand).resolves({});
    const result = await request('DELETE', `/api/meal-plan/${PLAN}`);

    expect(result.statusCode).toBe(204);
    const [own, sentinel, ...unused] = transactItems();
    expect(own!.Delete!.ConditionExpression).not.toContain('usedBy');
    expect(sentinel!.Delete!.Key).toMatchObject({ SK: 'NAME#PLAN#week 1' });
    expect(unused.map((item) => item.Update!.Key!.SK)).toEqual([`MEAL#${BREAKFAST}`, `MEAL#${LUNCH}`]);
  });

  test('GET /api/meal-plan fetches Meals, then Ingredients, once for the whole page', async () => {
    ddb.on(QueryCommand).resolves({ Items: [plan(), plan({ id: '01JP1ANBBBBBBBBBBBBBBBBBBB', name: 'Week 2', mealIds: [DINNER] })] });
    table();
    const result = await request('GET', '/api/meal-plan', { query: { orderBy: 'name' } });

    expect(body(result)).toMatchObject({ count: 2, data: [{ name: 'Week 1', meals: [{}, {}] }, { name: 'Week 2', meals: [{ name: 'Soup' }] }] });
    expect(ddb.commandCalls(BatchGetCommand)).toHaveLength(2);
  });

  test('GET /api/meal-plan/options returns id, name and mealIds in order', async () => {
    ddb.on(QueryCommand).resolves({ Items: [{ id: PLAN, name: 'Week 1', mealIds: [LUNCH, BREAKFAST] }] });
    const result = await request('GET', '/api/meal-plan/options');
    expect(body(result)).toEqual([{ id: PLAN, name: 'Week 1', mealIds: [LUNCH, BREAKFAST] }]);
  });

  test('GET /api/meal-plan/:id of someone else is a 404', async () => {
    ddb.on(GetCommand).resolves({});
    const result = await request('GET', `/api/meal-plan/${PLAN}`);
    expect(body(result).message).toBe('No meal plan found with the provided id.');
  });
});
