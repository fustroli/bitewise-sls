import { z } from 'zod';

// Avatar upload rules (docs/plan.md, Avatars), as in bitewise-backend's avatar.policy.ts.

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Body of POST /users/me/avatar-upload: the type the presigned POST will be pinned to. */
export const avatarUploadSchema = z.object({
  contentType: z.enum(AVATAR_CONTENT_TYPES, { error: 'Avatar must be a JPEG, PNG or WebP image' }),
});

/** A presigned POST: send `fields` plus the `file` as multipart/form-data to `url`. */
export interface AvatarUpload {
  url: string;
  fields: Record<string, string>;
}
