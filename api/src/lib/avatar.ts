import { S3Client } from '@aws-sdk/client-s3';
import { requireEnv } from './env';

// Avatar bucket layout (docs/plan.md, Avatars):
//   uploads/<sub>/<ulid>       raw browser upload (presigned POST), expired by lifecycle after 1 day
//   avatars/<sub>/<ulid>.webp  re-encoded avatar served by CloudFront under /avatars/*

export const AVATAR_BUCKET = requireEnv('AVATAR_BUCKET');

// Module scope: reused across warm invocations
export const s3 = new S3Client({});

export const uploadKey = (owner: string, id: string) => `uploads/${owner}/${id}`;
export const avatarKey = (owner: string, id: string) => `avatars/${owner}/${id}.webp`;
export const avatarPrefix = (owner: string) => `avatars/${owner}/`;

/** Owner and id of an `uploads/<sub>/<ulid>` key; null for anything else. */
export function parseUploadKey(key: string): { owner: string; id: string } | null {
  const match = /^uploads\/([^/]+)\/([^/]+)$/.exec(key);
  return match ? { owner: match[1]!, id: match[2]! } : null;
}
