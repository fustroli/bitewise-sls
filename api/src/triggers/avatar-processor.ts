import { Logger } from '@aws-lambda-powertools/logger';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand } from '@aws-sdk/client-s3';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { S3Handler } from 'aws-lambda';
import sharp from 'sharp';
import { AVATAR_BUCKET, avatarKey, parseUploadKey, s3 } from '../lib/avatar';
import { ddb, TABLE_NAME } from '../lib/ddb';
import { ownerKey } from '../lib/owned';

const logger = new Logger({ serviceName: 'avatar-processor' });

const SIZE_PX = 512;
const FORMATS = ['jpeg', 'png', 'webp'];
// A 5 MB PNG can still decode to gigabytes; 40 MP covers any phone photo
const MAX_INPUT_PIXELS = 40_000_000;
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * S3 `ObjectCreated` on `uploads/` (docs/plan.md, Avatars): re-encodes the upload to a 512×512
 * WebP without EXIF, points the Profile's `avatarKey` at it, then deletes the upload and the
 * previous avatar. Writes go to `avatars/`, outside the trigger prefix, so it can't re-trigger itself.
 */
export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    // Event keys are URL-encoded, spaces as `+`
    await processUpload(decodeURIComponent(record.s3.object.key.replace(/\+/g, ' ')));
  }
};

async function processUpload(key: string): Promise<void> {
  const upload = parseUploadKey(key);
  if (!upload) {
    logger.warn('Not an avatar upload key', { key });
    return;
  }
  const { owner, id } = upload;

  let input: Uint8Array;
  try {
    const object = await s3.send(new GetObjectCommand({ Bucket: AVATAR_BUCKET, Key: key }));
    input = await object.Body!.transformToByteArray();
  } catch (error) {
    // A redelivered event after the upload was already processed and deleted
    if (error instanceof NoSuchKey) return logger.info('Upload already gone', { key });
    throw error;
  }

  const avatar = await encode(input);
  if (!avatar) {
    logger.warn('Avatar rejected: not a JPEG, PNG or WebP image', { key, owner });
    await deleteObject(key);
    return;
  }

  const newKey = avatarKey(owner, id);
  await s3.send(
    new PutObjectCommand({
      Bucket: AVATAR_BUCKET,
      Key: newKey,
      Body: avatar,
      ContentType: 'image/webp',
      CacheControl: CACHE_CONTROL,
    }),
  );

  try {
    const { Attributes } = await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: ownerKey(owner), SK: 'PROFILE' },
        UpdateExpression: 'SET avatarKey = :key, updatedAt = :now',
        // ULIDs sort by time: an older upload processed late never replaces a newer avatar.
        // `<=` keeps a redelivered event idempotent.
        ConditionExpression: 'attribute_exists(PK) AND (attribute_not_exists(avatarKey) OR avatarKey <= :key)',
        ExpressionAttributeValues: { ':key': newKey, ':now': new Date().toISOString() },
        ReturnValues: 'UPDATED_OLD',
      }),
    );
    const previous = Attributes?.avatarKey as string | undefined;
    if (previous && previous !== newKey) await deleteObject(previous);
    logger.info('Avatar updated', { owner, avatarKey: newKey });
  } catch (error) {
    if (!(error instanceof ConditionalCheckFailedException)) throw error;
    // Account deleted meanwhile, or a newer avatar already set
    logger.info('Avatar discarded', { owner, avatarKey: newKey });
    await deleteObject(newKey);
  }
  await deleteObject(key);
}

/** The re-encoded avatar; null when the upload isn't a JPEG, PNG or WebP image sharp can decode. */
async function encode(input: Uint8Array): Promise<Buffer | null> {
  try {
    const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });
    const { format } = await image.metadata();
    if (!format || !FORMATS.includes(format)) return null;
    // rotate() applies the EXIF orientation; sharp drops EXIF/GPS from the output by default
    return await image.rotate().resize(SIZE_PX, SIZE_PX, { fit: 'cover' }).webp().toBuffer();
  } catch {
    return null;
  }
}

async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: AVATAR_BUCKET, Key: key }));
}
