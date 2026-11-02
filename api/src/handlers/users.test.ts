import { beforeEach, describe, expect, test } from 'bun:test';
import { CognitoIdentityProviderClient, DeleteUserCommand, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import {
  BatchWriteCommand,
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
process.env.AVATAR_BUCKET = 'avatars-bucket';
// Presigning signs locally, so it needs a region and credentials (fake ones are fine)
Object.assign(process.env, { AWS_REGION: 'us-east-1', AWS_ACCESS_KEY_ID: 'AKIATEST', AWS_SECRET_ACCESS_KEY: 'secret' });
const ddb = mockClient(DynamoDBDocumentClient);
const cognito = mockClient(CognitoIdentityProviderClient);
const s3 = mockClient(S3Client);
const { handler } = await import('./users');

const OWNER = 'owner-sub';

function request(method: string, path: string, body?: unknown) {
  const event = {
    rawPath: path,
    headers: { authorization: 'Bearer access-token' },
    body: body === undefined ? undefined : JSON.stringify(body),
    isBase64Encoded: false,
    requestContext: { http: { method }, authorizer: { jwt: { claims: { sub: OWNER } } } },
  } as unknown as ApiEvent;
  return (handler as (e: ApiEvent, c: Context) => Promise<ApiResult>)(event, {} as Context);
}

const body = (result: ApiResult) => JSON.parse(result.body as string);

const profile = (overrides: Record<string, unknown> = {}) => ({
  PK: `USER#${OWNER}`,
  SK: 'PROFILE',
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
  ...overrides,
});

function cognitoUser(username = OWNER) {
  cognito.on(GetUserCommand).resolves({
    Username: username,
    UserAttributes: [
      { Name: 'email', Value: 'ann@example.com' },
      { Name: 'email_verified', Value: 'true' },
    ],
  });
}

const canceled = (...codes: string[]) =>
  new TransactionCanceledException({ message: 'canceled', $metadata: {}, CancellationReasons: codes.map((Code) => ({ Code })) });

describe('users', () => {
  beforeEach(() => {
    ddb.reset();
    cognito.reset();
    s3.reset();
  });

  describe('GET /api/users/me', () => {
    test('every group field is present, null when unset; email comes from Cognito', async () => {
      ddb.on(GetCommand).resolves({ Item: profile({ targets: { macroPlan: 'balanced' } }) });
      cognitoUser();
      const result = await request('GET', '/api/users/me');

      expect(body(result)).toMatchObject({
        id: OWNER,
        email: 'ann@example.com',
        emailVerified: true,
        hasPassword: true,
        personalInformation: { userName: null, firstName: null, lastName: null, phoneNumber: null, dateOfBirth: null },
        targets: { calorieTarget: null, macroPlan: 'balanced' },
        avatarUrl: null,
        createTimeStamp: '2026-10-20T10:00:00.000Z',
      });
      expect(cognito.commandCalls(GetUserCommand)[0]!.args[0].input).toEqual({ AccessToken: 'access-token' });
    });

    test('a Google-only User has no password', async () => {
      ddb.on(GetCommand).resolves({ Item: profile() });
      cognitoUser('google_1098');
      expect(body(await request('GET', '/api/users/me')).hasPassword).toBe(false);
    });

    test('no Profile is a 404', async () => {
      ddb.on(GetCommand).resolves({});
      expect(body(await request('GET', '/api/users/me')).message).toBe('No user found with the provided id.');
    });
  });

  describe('PATCH /api/users/me', () => {
    test('missing fields stay, null clears, groups are written whole and conditionally', async () => {
      ddb.on(GetCommand).resolves({ Item: profile({ bodyStats: { heightCm: 180, weightKg: 80 } }) });
      ddb.on(UpdateCommand).resolves({});
      cognitoUser();
      const result = await request('PATCH', '/api/users/me', { bodyStats: { weightKg: null, sex: 'FEMALE' } });

      expect(body(result).bodyStats).toMatchObject({ heightCm: 180, weightKg: null, sex: 'FEMALE' });
      const input = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
      expect(input.ExpressionAttributeValues![':g0']).toEqual({ heightCm: 180, sex: 'FEMALE' });
      expect(input.ConditionExpression).toBe('attribute_exists(PK) AND #updatedAt = :prev');
    });

    test('a new username swaps the global sentinel', async () => {
      ddb.on(GetCommand).resolves({ Item: profile({ personalInformation: { userName: 'old' } }) });
      ddb.on(TransactWriteCommand).resolves({});
      cognitoUser();
      await request('PATCH', '/api/users/me', { personalInformation: { userName: 'Ánn' } });

      const [, release, claim] = ddb.commandCalls(TransactWriteCommand)[0]!.args[0].input.TransactItems!;
      expect(release!.Delete!.Key).toEqual({ PK: 'USERNAME#old', SK: 'USERNAME' });
      expect(claim!.Put!.Item).toEqual({ PK: 'USERNAME#ann', SK: 'USERNAME', sub: OWNER });
    });

    test('a taken username is a 409 with the EC2 app message', async () => {
      ddb.on(GetCommand).resolves({ Item: profile() });
      ddb.on(TransactWriteCommand).rejects(canceled('None', 'ConditionalCheckFailed'));
      const result = await request('PATCH', '/api/users/me', { personalInformation: { userName: 'ann' } });
      expect(body(result)).toMatchObject({ statusCode: 409, message: "Username 'ann' is already taken." });
    });

    test('dateOfBirth is stored as a date', async () => {
      ddb.on(GetCommand).resolves({ Item: profile() });
      ddb.on(UpdateCommand).resolves({});
      cognitoUser();
      const result = await request('PATCH', '/api/users/me', { personalInformation: { dateOfBirth: '1990-05-17T12:00:00Z' } });
      expect(body(result).personalInformation.dateOfBirth).toBe('1990-05-17');
    });

    test.each([
      [{ bodyStats: { heightCm: 99 } }, 'bodyStats.heightCm must not be less than 100'],
      [{ bodyStats: { heightCm: 180.5 } }, 'bodyStats.heightCm must be an integer number'],
      [{ bodyStats: { neckCm: 30.3 } }, 'bodyStats.neckCm must be a multiple of 0.5'],
      [{ bodyStats: { weightKg: 80.25 } }, 'bodyStats.weightKg must be a number conforming to the specified constraints'],
      [{ targets: { macroPlan: 'keto' } }, 'targets.macroPlan must be one of the following values: balanced, low_fat, low_carb, high_protein'],
      [{ personalInformation: null }, 'personalInformation must be an object'],
      [{ socialProfiles: { tiktok: 'x' } }, 'socialProfiles.property tiktok should not exist'],
      [{ settings: {} }, 'property settings should not exist'],
    ])('validation: %#', async (input, message) => {
      const result = await request('PATCH', '/api/users/me', input);
      expect(result.statusCode).toBe(400);
      expect(body(result).message).toContain(message);
    });
  });

  test('GET /api/users/me/statistics counts each kind', async () => {
    ddb.on(QueryCommand).callsFake((input) => ({ Count: { 'ING#': 3, 'MEAL#': 2, 'PLAN#': 1 }[input.ExpressionAttributeValues[':prefix'] as string] }));
    expect(body(await request('GET', '/api/users/me/statistics'))).toEqual({ ingredients: 3, meals: 2, mealPlans: 1 });
  });

  test('DELETE /api/users/me deletes every item and the username, then the Cognito user', async () => {
    ddb.on(QueryCommand).resolves({
      Items: [
        { PK: `USER#${OWNER}`, SK: 'PROFILE', personalInformation: { userName: 'Ann' } },
        { PK: `USER#${OWNER}`, SK: 'ING#01J0AT5AAAAAAAAAAAAAAAAAAA' },
        { PK: `USER#${OWNER}`, SK: 'NAME#ING#oats' },
      ],
    });
    ddb.on(BatchWriteCommand).resolves({});
    s3.on(ListObjectsV2Command).resolves({ Contents: [{ Key: `avatars/${OWNER}/01J0AT5AAAAAAAAAAAAAAAAAAA.webp` }] });
    s3.on(DeleteObjectsCommand).resolves({});
    cognito.on(DeleteUserCommand).resolves({});
    const result = await request('DELETE', '/api/users/me');

    expect(result.statusCode).toBe(204);
    expect(s3.commandCalls(ListObjectsV2Command)[0]!.args[0].input).toMatchObject({ Bucket: 'avatars-bucket', Prefix: `avatars/${OWNER}/` });
    expect(s3.commandCalls(DeleteObjectsCommand)[0]!.args[0].input.Delete!.Objects).toEqual([
      { Key: `avatars/${OWNER}/01J0AT5AAAAAAAAAAAAAAAAAAA.webp` },
    ]);
    const deleted = ddb.commandCalls(BatchWriteCommand)[0]!.args[0].input.RequestItems!['bitewise-sls']!.map((r) => r.DeleteRequest!.Key);
    expect(deleted).toContainEqual({ PK: 'USERNAME#ann', SK: 'USERNAME' });
    expect(deleted).toHaveLength(4);
    expect(cognito.commandCalls(DeleteUserCommand)[0]!.args[0].input).toEqual({ AccessToken: 'access-token' });
  });

  describe('POST /api/users/me/avatar-upload', () => {
    test('presigns a POST to uploads/<sub>/<ulid>, pinned to the type and 5 MB', async () => {
      const result = await request('POST', '/api/users/me/avatar-upload', { contentType: 'image/png' });

      expect(result.statusCode).toBe(201);
      const { url, fields } = body(result);
      expect(url).toContain('avatars-bucket');
      expect(fields.key).toMatch(new RegExp(`^uploads/${OWNER}/[0-9A-HJKMNP-TV-Z]{26}$`));
      expect(fields['Content-Type']).toBe('image/png');
      const policy = JSON.parse(Buffer.from(fields.Policy, 'base64').toString('utf8'));
      expect(policy.conditions).toContainEqual(['content-length-range', 1, 5 * 1024 * 1024]);
      expect(policy.conditions).toContainEqual(['eq', '$Content-Type', 'image/png']);
      expect(policy.conditions).toContainEqual({ key: fields.key });
    });

    test('other types get the EC2 app message', async () => {
      const result = await request('POST', '/api/users/me/avatar-upload', { contentType: 'image/gif' });

      expect(result.statusCode).toBe(400);
      expect(body(result).message).toEqual(['Avatar must be a JPEG, PNG or WebP image']);
    });
  });
});
