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
const { handler } = await import('./ingredients');

const OWNER = 'owner-sub';
const ID = '01JABCDEFGHJKMNPQRSTVWXYZ0';
const OTHER = '01JABCDEFGHJKMNPQRSTVWXYZ1';

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

const apple = {
  name: 'Apple',
  protein: 0.3,
  totalFat: 0.2,
  saturatedFat: 0.1,
  totalCarbohydrates: 14,
  sugar: 10,
  dietaryFiber: 2.4,
  calories: 52,
  unit: '100g',
};

const item = (overrides: Record<string, unknown> = {}) => ({
  PK: `USER#${OWNER}`,
  SK: `ING#${ID}`,
  id: ID,
  ...apple,
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T10:00:00.000Z',
  ...overrides,
});

const canceled = (...codes: string[]) =>
  new TransactionCanceledException({
    message: 'canceled',
    $metadata: {},
    CancellationReasons: codes.map((Code) => ({ Code })),
  });

describe('ingredients', () => {
  beforeEach(() => ddb.reset());

  describe('POST /api/ingredient', () => {
    test('creates the Ingredient and its name sentinel in one transaction', async () => {
      ddb.on(TransactWriteCommand).resolves({});
      const result = await request('POST', '/api/ingredient', { body: { ...apple, protein: 0.34 } });

      expect(result.statusCode).toBe(201);
      expect(body(result)).toMatchObject({ name: 'Apple', protein: 0.3, userId: OWNER, deleteTimeStamp: null });
      const [put, sentinel] = ddb.commandCalls(TransactWriteCommand)[0]!.args[0].input.TransactItems!;
      expect(put!.Put!.Item).toMatchObject({ PK: `USER#${OWNER}`, name: 'Apple' });
      expect(sentinel!.Put!.Item).toMatchObject({ PK: `USER#${OWNER}`, SK: 'NAME#ING#apple' });
    });

    test('a taken name (case and accents ignored) is a 409', async () => {
      ddb.on(TransactWriteCommand).rejects(canceled('None', 'ConditionalCheckFailed'));
      const result = await request('POST', '/api/ingredient', { body: { ...apple, name: 'Ápple' } });

      expect(result.statusCode).toBe(409);
      expect(body(result)).toEqual({
        statusCode: 409,
        message: 'You already have an ingredient named Ápple.',
        error: 'Conflict',
      });
    });

    test('validation keeps the EC2 app messages', async () => {
      const result = await request('POST', '/api/ingredient', {
        body: { ...apple, name: 'A', protein: -1, totalFat: 1, saturatedFat: 2, unit: 'kg', extra: true },
      });

      expect(result.statusCode).toBe(400);
      expect(body(result).message).toEqual(
        expect.arrayContaining([
          'Name must be between 2 and 255 characters',
          'protein must not be less than 0',
          'unit must be one of the following values: 100g, piece',
          'property extra should not exist',
        ]),
      );
    });

    test('saturated fat above total fat is rejected', async () => {
      const result = await request('POST', '/api/ingredient', { body: { ...apple, totalFat: 1, saturatedFat: 2 } });
      expect(body(result).message).toEqual(['totalFat must be greater than or equal to saturatedFat']);
    });
  });

  describe('GET /api/ingredient', () => {
    const items = [
      item({ id: ID, name: 'Banana', calories: 89 }),
      item({ id: OTHER, name: 'apple', calories: 52 }),
      item({ id: '01JABCDEFGHJKMNPQRSTVWXYZ2', name: 'Crème fraîche', calories: 290 }),
    ];

    test('lists with search (accent-insensitive), order and page', async () => {
      ddb.on(QueryCommand).resolves({ Items: items });
      const result = await request('GET', '/api/ingredient', {
        query: { search: 'creme', orderBy: 'calories', orderDirection: 'desc' },
      });

      expect(body(result).count).toBe(1);
      expect(body(result).data[0].name).toBe('Crème fraîche');
    });

    test('orders names case-insensitively and pages with limit/offset', async () => {
      ddb.on(QueryCommand).resolves({ Items: items });
      const result = await request('GET', '/api/ingredient', { query: { orderBy: 'name', limit: '1', offset: '1' } });

      expect(body(result)).toMatchObject({ count: 3, data: [{ name: 'Banana' }] });
    });

    test('ids fetch exactly those, ignoring limit', async () => {
      ddb.on(BatchGetCommand).resolves({ Responses: { 'bitewise-sls': items.slice(0, 2) } });
      const result = await request('GET', '/api/ingredient', { query: { ids: `${ID},${OTHER}`, limit: '1' } });

      expect(body(result).data).toHaveLength(2);
      expect(ddb.commandCalls(QueryCommand)).toHaveLength(0);
    });

    test('an unknown orderBy is a 400 listing the sortable fields', async () => {
      const result = await request('GET', '/api/ingredient', { query: { orderBy: 'owner' } });
      expect(result.statusCode).toBe(400);
      expect(body(result).message[0]).toStartWith('orderBy must be one of: name, protein');
    });

    test('createTimeStamp sorts by creation', async () => {
      ddb.on(QueryCommand).resolves({ Items: items });
      const result = await request('GET', '/api/ingredient', { query: { orderBy: 'createTimeStamp' } });
      expect(result.statusCode).toBe(200);
    });
  });

  test('GET /api/ingredient/options returns id, name, unit by name', async () => {
    ddb.on(QueryCommand).resolves({
      Items: [
        { id: ID, name: 'b', unit: 'piece' },
        { id: OTHER, name: 'A', unit: '100g' },
      ],
    });
    const result = await request('GET', '/api/ingredient/options');
    expect(body(result)).toEqual([
      { id: OTHER, name: 'A', unit: '100g' },
      { id: ID, name: 'b', unit: 'piece' },
    ]);
  });

  describe('PATCH /api/ingredient/:id', () => {
    test("someone else's or a missing id is a 404", async () => {
      ddb.on(GetCommand).resolves({});
      const result = await request('PATCH', `/api/ingredient/${ID}`, { body: { calories: 1 } });
      expect(body(result)).toEqual({
        statusCode: 404,
        message: 'No ingredient found with the provided id.',
        error: 'Not Found',
      });
    });

    test('checks fat on the merged Ingredient', async () => {
      ddb.on(GetCommand).resolves({ Item: item({ totalFat: 1, saturatedFat: 0.5 }) });
      const result = await request('PATCH', `/api/ingredient/${ID}`, { body: { saturatedFat: 2 } });
      expect(body(result).message).toEqual(['totalFat must be greater than or equal to saturatedFat']);
    });

    test('updates only the sent fields', async () => {
      ddb.on(GetCommand).resolves({ Item: item() });
      ddb.on(UpdateCommand).resolves({});
      const result = await request('PATCH', `/api/ingredient/${ID}`, { body: { calories: 60 } });

      expect(body(result)).toMatchObject({ calories: 60, name: 'Apple' });
      const input = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
      expect(input.UpdateExpression).toBe('SET #f0 = :v0, #updatedAt = :now');
      expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    });

    test('a rename swaps the name sentinel', async () => {
      ddb.on(GetCommand).resolves({ Item: item() });
      ddb.on(TransactWriteCommand).resolves({});
      await request('PATCH', `/api/ingredient/${ID}`, { body: { name: 'Green apple' } });

      const [, oldName, newName] = ddb.commandCalls(TransactWriteCommand)[0]!.args[0].input.TransactItems!;
      expect(oldName!.Delete!.Key).toEqual({ PK: `USER#${OWNER}`, SK: 'NAME#ING#apple' });
      expect(newName!.Put!.Item).toMatchObject({ SK: 'NAME#ING#green apple' });
    });

    test('changing only case keeps the sentinel', async () => {
      ddb.on(GetCommand).resolves({ Item: item() });
      ddb.on(UpdateCommand).resolves({});
      await request('PATCH', `/api/ingredient/${ID}`, { body: { name: 'APPLE' } });
      expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    });

    test('renaming onto a taken name is a 409', async () => {
      ddb.on(GetCommand).resolves({ Item: item() });
      ddb.on(TransactWriteCommand).rejects(canceled('None', 'None', 'ConditionalCheckFailed'));
      const result = await request('PATCH', `/api/ingredient/${ID}`, { body: { name: 'Pear' } });
      expect(body(result).message).toBe('You already have an ingredient named Pear.');
    });

    test('a malformed id is a 400', async () => {
      const result = await request('PATCH', '/api/ingredient/42', { body: {} });
      expect(body(result).message).toBe('Validation failed (ULID is expected)');
    });
  });

  describe('DELETE /api/ingredient/:id', () => {
    test('deletes the Ingredient and its sentinel', async () => {
      ddb.on(GetCommand).resolves({ Item: item() });
      ddb.on(TransactWriteCommand).resolves({});
      const result = await request('DELETE', `/api/ingredient/${ID}`);

      expect(result.statusCode).toBe(204);
      const [own, sentinel] = ddb.commandCalls(TransactWriteCommand)[0]!.args[0].input.TransactItems!;
      expect(own!.Delete!.ConditionExpression).toContain('attribute_not_exists(usedBy)');
      expect(sentinel!.Delete!.Key).toEqual({ PK: `USER#${OWNER}`, SK: 'NAME#ING#apple' });
    });

    test('409 naming the Meals that use it', async () => {
      ddb.on(GetCommand).resolves({ Item: item({ usedBy: new Set([OTHER, ID]) }) });
      ddb.on(BatchGetCommand).resolves({
        Responses: {
          'bitewise-sls': [
            { id: OTHER, name: 'Smoothie' },
            { id: ID, name: 'Porridge' },
          ],
        },
      });
      const result = await request('DELETE', `/api/ingredient/${ID}`);
      expect(body(result).message).toBe('This ingredient is used in meals: Porridge, Smoothie.');
      expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    });
  });

  test('unknown routes answer like NestJS', async () => {
    const result = await request('GET', `/api/ingredient/${ID}`);
    expect(body(result)).toEqual({ statusCode: 404, message: `Cannot GET /api/ingredient/${ID}`, error: 'Not Found' });
  });

  test('unexpected errors are a plain 500', async () => {
    ddb.on(QueryCommand).rejects(new Error('boom'));
    const result = await request('GET', '/api/ingredient');
    expect(result.statusCode).toBe(500);
    expect(body(result)).toEqual({ statusCode: 500, message: 'Internal server error' });
  });
});
