import { Logger } from '@aws-lambda-powertools/logger';
import {
  CognitoIdentityProviderClient,
  DeleteUserCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DeleteObjectsCommand, paginateListObjectsV2 } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import {
  BatchWriteCommand,
  type BatchWriteCommandOutput,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  AVATAR_MAX_BYTES,
  type AvatarUpload,
  avatarUploadSchema,
  PROFILE_GROUPS,
  type ProfileGroup,
  profilePatchSchema,
} from '@bitewise/shared';
import { ulid } from 'ulidx';
import { AVATAR_BUCKET, avatarPrefix, s3, uploadKey } from '../lib/avatar';
import { ddb, TABLE_NAME } from '../lib/ddb';
import { type ApiEvent, type ApiResult, conflict, json, jsonBody, noContent, notFound } from '../lib/http';
import type { ProfileItem } from '../lib/items';
import { cancellationReasons, type Kind, nameKey, ownerKey } from '../lib/owned';
import { type Request, router } from '../lib/router';
import { parse } from '../lib/validation';
import { type TransactItem, transact } from '../lib/writes';

const logger = new Logger({ serviceName: 'users' });
// Module scope: reused across warm invocations
const cognito = new CognitoIdentityProviderClient({});
// The app origin: CloudFront serves the avatar bucket's avatars/ under /avatars/*
const AVATAR_BASE_URL = process.env.AVATAR_BASE_URL;
// How long the browser has to start the upload
const AVATAR_UPLOAD_EXPIRES_SECONDS = 5 * 60;

const GROUPS = Object.keys(PROFILE_GROUPS) as ProfileGroup[];
const profileKey = (owner: string) => ({ PK: ownerKey(owner), SK: 'PROFILE' });
// Usernames are unique across all Users, not per Owner: a global sentinel item
const usernameKey = (userName: string) => ({ PK: `USERNAME#${nameKey(userName)}`, SK: 'USERNAME' });

/** The caller's access token; GetUser and DeleteUser act on "this user" with it, no IAM needed. */
function accessToken(event: ApiEvent): string {
  return (event.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
}

async function getProfile(owner: string): Promise<ProfileItem> {
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: profileKey(owner) }));
  if (!Item) throw notFound('No user found with the provided id.');
  return Item as ProfileItem;
}

/** Every field of every group, null when unset, like the EC2 app's embedded columns. */
function groups(profile: ProfileItem) {
  return Object.fromEntries(
    GROUPS.map((group) => [
      group,
      Object.fromEntries(PROFILE_GROUPS[group].map((field) => [field, profile[group]?.[field] ?? null])),
    ]),
  );
}

/** Today's response shape. email, emailVerified and hasPassword come from Cognito. */
async function serialize(event: ApiEvent, owner: string, profile: ProfileItem) {
  const user = await cognito.send(new GetUserCommand({ AccessToken: accessToken(event) }));
  const attribute = (name: string) => user.UserAttributes?.find((a) => a.Name === name)?.Value;
  return {
    id: owner,
    email: attribute('email') ?? null,
    emailVerified: attribute('email_verified') === 'true',
    // Not exposed by Cognito's user APIs; the frontend keeps the pending change it started
    pendingEmail: null,
    pendingEmailExpiresAt: null,
    // A Google-only User is named `google_<id>`; a native or linked User has a password
    hasPassword: !/^google_/i.test(user.Username ?? ''),
    ...groups(profile),
    avatarUrl: profile.avatarKey && AVATAR_BASE_URL ? `${AVATAR_BASE_URL}/${profile.avatarKey}` : null,
    createTimeStamp: profile.createdAt,
    updateTimeStamp: profile.updatedAt,
    deleteTimeStamp: null,
  };
}

async function getMe({ event, owner }: Request) {
  return json(200, await serialize(event, owner, await getProfile(owner)));
}

async function updateMe({ event, owner }: Request, retried = false): Promise<ApiResult> {
  const patch = parse(profilePatchSchema, jsonBody(event));
  const current = await getProfile(owner);
  const changed = GROUPS.filter((group) => patch[group]);
  if (!changed.length) return json(200, await serialize(event, owner, current));

  // Missing fields stay, null clears; whole groups are written back
  const merged: ProfileItem = { ...current };
  for (const group of changed) {
    const changes = patch[group]!;
    const values = { ...current[group] };
    for (const [field, value] of Object.entries(changes)) {
      if (value === undefined) continue;
      if (value === null) delete values[field];
      else values[field] = value;
    }
    // An empty username is no username (it couldn't be unique)
    if (group === 'personalInformation' && values.userName === '') delete values.userName;
    merged[group] = values;
  }

  const now = new Date().toISOString();
  const before = current.personalInformation?.userName as string | undefined;
  const after = merged.personalInformation?.userName as string | undefined;
  const usernameChanged = (before ? nameKey(before) : undefined) !== (after ? nameKey(after) : undefined);

  const update = {
    TableName: TABLE_NAME,
    Key: profileKey(owner),
    UpdateExpression: `SET ${[...changed.map((_, i) => `#g${i} = :g${i}`), '#updatedAt = :now'].join(', ')}`,
    // Unchanged since the read: the groups are merged from what was read
    ConditionExpression: 'attribute_exists(PK) AND #updatedAt = :prev',
    ExpressionAttributeNames: { ...Object.fromEntries(changed.map((group, i) => [`#g${i}`, group])), '#updatedAt': 'updatedAt' },
    ExpressionAttributeValues: {
      ...Object.fromEntries(changed.map((group, i) => [`:g${i}`, merged[group]])),
      ':now': now,
      ':prev': current.updatedAt,
    },
  };
  const items: TransactItem[] = [{ Update: update }];
  if (usernameChanged && before) items.push({ Delete: { TableName: TABLE_NAME, Key: usernameKey(before) } });
  const claimIndex = items.length;
  if (usernameChanged && after) {
    items.push({
      Put: {
        TableName: TABLE_NAME,
        Item: { ...usernameKey(after), sub: owner },
        ConditionExpression: 'attribute_not_exists(PK)',
      },
    });
  }

  try {
    if (items.length === 1) await ddb.send(new UpdateCommand(update));
    else await transact(items);
  } catch (error) {
    const reasons = cancellationReasons(error);
    // Message from bitewise-backend's duplicate-entry filter
    if (after && reasons?.[claimIndex] === 'ConditionalCheckFailed') throw conflict(`Username '${after}' is already taken.`);
    const stale = reasons?.[0] === 'ConditionalCheckFailed' || (error as Error).name === 'ConditionalCheckFailedException';
    if (stale && !retried) return updateMe({ event, owner, params: {} }, true);
    throw error;
  }
  return json(200, await serialize(event, owner, { ...merged, updatedAt: now }));
}

/**
 * A presigned POST straight to S3: the file never passes through the Lambda (API Gateway caps
 * payloads at 10 MB anyway). S3 enforces the key, type and size; the avatar-processor Lambda
 * re-encodes the upload and sets `avatarKey`, so the client polls GET /users/me for the new avatarUrl.
 */
async function avatarUpload({ event, owner }: Request) {
  const { contentType } = parse(avatarUploadSchema, jsonBody(event));
  const key = uploadKey(owner, ulid());
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: AVATAR_BUCKET,
    Key: key,
    Conditions: [
      ['content-length-range', 1, AVATAR_MAX_BYTES],
      ['eq', '$Content-Type', contentType],
    ],
    Fields: { 'Content-Type': contentType },
    Expires: AVATAR_UPLOAD_EXPIRES_SECONDS,
  });
  const upload: AvatarUpload = { url, fields };
  return json(201, upload);
}

/** Dashboard counts of the User's Owned resources: one COUNT query each. */
async function statistics({ owner }: Request) {
  const count = async (kind: Kind) => {
    let total = 0;
    let start: Record<string, unknown> | undefined;
    do {
      const page = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
          ExpressionAttributeValues: { ':pk': ownerKey(owner), ':prefix': `${kind}#` },
          Select: 'COUNT',
          ExclusiveStartKey: start,
        }),
      );
      total += page.Count ?? 0;
      start = page.LastEvaluatedKey;
    } while (start);
    return total;
  };
  const [ingredients, meals, mealPlans] = await Promise.all([count('ING'), count('MEAL'), count('PLAN')]);
  return json(200, { ingredients, meals, mealPlans });
}

/**
 * Deletes everything the User has (hard deletes: Owned resources go too, unlike the EC2 app), then
 * the Cognito user, which also ends every session. Data first, so a failed Cognito call can be
 * retried; a repeat finds nothing left to delete.
 */
async function deleteMe({ event, owner }: Request) {
  const keys: Record<string, unknown>[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const page = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': ownerKey(owner) },
        ProjectionExpression: 'PK, SK, personalInformation.userName',
        ExclusiveStartKey: start,
      }),
    );
    for (const item of page.Items ?? []) {
      keys.push({ PK: item.PK, SK: item.SK });
      const userName = item.personalInformation?.userName;
      if (item.SK === 'PROFILE' && userName) keys.push(usernameKey(userName));
    }
    start = page.LastEvaluatedKey;
  } while (start);

  await batchDelete(keys);
  await deleteAvatars(owner);
  await cognito.send(new DeleteUserCommand({ AccessToken: accessToken(event) }));
  logger.info('Account deleted', { owner, items: keys.length });
  return noContent();
}

/** Every avatar object of the Owner (normally one); in-flight uploads expire by lifecycle. */
async function deleteAvatars(owner: string): Promise<void> {
  for await (const page of paginateListObjectsV2({ client: s3 }, { Bucket: AVATAR_BUCKET, Prefix: avatarPrefix(owner) })) {
    const objects = (page.Contents ?? []).map(({ Key }) => ({ Key }));
    if (objects.length) await s3.send(new DeleteObjectsCommand({ Bucket: AVATAR_BUCKET, Delete: { Objects: objects, Quiet: true } }));
  }
}

/** BatchWriteItem takes 25 requests per call; throttled ones come back and are retried. */
async function batchDelete(keys: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 25) {
    let requests: BatchWriteCommandOutput['UnprocessedItems'] = {
      [TABLE_NAME]: keys.slice(i, i + 25).map((Key) => ({ DeleteRequest: { Key } })),
    };
    for (let attempt = 0; requests?.[TABLE_NAME]?.length; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt));
      const result: BatchWriteCommandOutput = await ddb.send(new BatchWriteCommand({ RequestItems: requests }));
      requests = result.UnprocessedItems;
    }
  }
}

export const handler = router(
  {
    'GET /api/users/me': getMe,
    'GET /api/users/me/statistics': statistics,
    'POST /api/users/me/avatar-upload': avatarUpload,
    'PATCH /api/users/me': (request) => updateMe(request),
    'DELETE /api/users/me': deleteMe,
  },
  logger,
);
