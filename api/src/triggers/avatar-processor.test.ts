import { beforeEach, describe, expect, test } from 'bun:test';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Context, S3Event } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import sharp from 'sharp';

process.env.TABLE_NAME = 'bitewise-sls';
process.env.AVATAR_BUCKET = 'avatars-bucket';
const ddb = mockClient(DynamoDBDocumentClient);
const s3 = mockClient(S3Client);
const { handler } = await import('./avatar-processor');

const OWNER = 'owner-sub';
const ID = '01J0AT5BBBBBBBBBBBBBBBBBBB';
const UPLOAD = `uploads/${OWNER}/${ID}`;
const AVATAR = `avatars/${OWNER}/${ID}.webp`;

const run = (key = UPLOAD) =>
  (handler as (e: S3Event, c: Context, cb: () => void) => Promise<void>)(
    { Records: [{ s3: { object: { key } } }] } as unknown as S3Event,
    {} as Context,
    () => {},
  );

const uploaded = (bytes: Uint8Array) =>
  s3.on(GetObjectCommand).resolves({ Body: { transformToByteArray: async () => bytes } } as never);

const deletedKeys = () => s3.commandCalls(DeleteObjectCommand).map((call) => call.args[0].input.Key);

// A 800×400 JPEG with an EXIF orientation tag
const photo = await sharp({ create: { width: 800, height: 400, channels: 3, background: '#3a7' } })
  .jpeg()
  .withMetadata({ orientation: 6 })
  .toBuffer();

describe('avatar-processor', () => {
  beforeEach(() => {
    ddb.reset();
    s3.reset();
    s3.on(PutObjectCommand).resolves({});
    s3.on(DeleteObjectCommand).resolves({});
  });

  test('re-encodes to a 512×512 WebP without EXIF, sets avatarKey, deletes the upload and previous avatar', async () => {
    uploaded(photo);
    ddb.on(UpdateCommand).resolves({ Attributes: { avatarKey: `avatars/${OWNER}/01J0AT5AAAAAAAAAAAAAAAAAAA.webp` } });
    await run();

    const put = s3.commandCalls(PutObjectCommand)[0]!.args[0].input;
    expect(put).toMatchObject({ Bucket: 'avatars-bucket', Key: AVATAR, ContentType: 'image/webp' });
    expect(put.CacheControl).toContain('immutable');
    const meta = await sharp(put.Body as Buffer).metadata();
    expect(meta).toMatchObject({ format: 'webp', width: 512, height: 512 });
    expect(meta.exif).toBeUndefined();

    const update = ddb.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(update.Key).toEqual({ PK: `USER#${OWNER}`, SK: 'PROFILE' });
    expect(update.ExpressionAttributeValues![':key']).toBe(AVATAR);
    expect(deletedKeys()).toEqual([`avatars/${OWNER}/01J0AT5AAAAAAAAAAAAAAAAAAA.webp`, UPLOAD]);
  });

  test('a redelivered event keeps the avatar it already set', async () => {
    uploaded(photo);
    ddb.on(UpdateCommand).resolves({ Attributes: { avatarKey: AVATAR } });
    await run();

    expect(deletedKeys()).toEqual([UPLOAD]);
  });

  test('a newer avatar or a deleted account discards the new one', async () => {
    uploaded(photo);
    ddb.on(UpdateCommand).rejects(new ConditionalCheckFailedException({ message: 'failed', $metadata: {} }));
    await run();

    expect(deletedKeys()).toEqual([AVATAR, UPLOAD]);
  });

  test('not an image: only the upload is deleted', async () => {
    uploaded(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'));
    await run();

    expect(s3.commandCalls(PutObjectCommand)).toHaveLength(0);
    expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);
    expect(deletedKeys()).toEqual([UPLOAD]);
  });

  test('an upload already processed is skipped', async () => {
    s3.on(GetObjectCommand).rejects(new NoSuchKey({ message: 'gone', $metadata: {} }));
    await run();

    expect(s3.commandCalls(PutObjectCommand)).toHaveLength(0);
    expect(deletedKeys()).toEqual([]);
  });

  test('keys outside uploads/<sub>/<id> are ignored', async () => {
    await run(`avatars/${OWNER}/${ID}.webp`);

    expect(s3.commandCalls(GetObjectCommand)).toHaveLength(0);
  });
});
