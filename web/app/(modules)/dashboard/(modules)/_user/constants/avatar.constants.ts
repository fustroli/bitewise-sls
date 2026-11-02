import { AVATAR_CONTENT_TYPES, AVATAR_MAX_BYTES } from '@bitewise/shared';

// The API's rules (S3 enforces them on the presigned POST).
export const MAX_FILE_SIZE = AVATAR_MAX_BYTES;

export const ACCEPTED_IMAGE_TYPES: string[] = [...AVATAR_CONTENT_TYPES];
