import { AvatarUpload, profilePatchSchema } from '@bitewise/shared';
import {
  IUser,
  IUserChange,
} from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { api, unwrap } from '@/app/lib/api';

import { TApiResult } from '@/app/utils/interfaces';
import { avatarFileSchema } from '@/app/(modules)/dashboard/(modules)/_user/validations';
import { copy } from '@/app/copy';
import { parseInput } from '@/app/utils/helpers';
import { queryOptions } from '@tanstack/react-query';

export const ME_KEY = ['me'] as const;

export const meQuery = queryOptions({
  queryKey: ME_KEY,
  queryFn: async () => unwrap(await api<IUser>('users/me')),
});

/** Saves part of the Profile; checked with the API's own schema first. */
export async function updateUser(
  change: IUserChange,
): Promise<TApiResult<IUser>> {
  const input = parseInput(profilePatchSchema, change);
  if (!input.ok) return input;

  return api<IUser>('users/me', { method: 'PATCH', body: input.data });
}

const AVATAR_POLL_INTERVAL_MS = 1000;
// A cold start plus sharp takes a few seconds; no change by then means rejected
const AVATAR_POLL_TIMEOUT_MS = 20_000;
const HTTP_BAD_REQUEST = 400;

const avatarRejected = {
  ok: false,
  status: HTTP_BAD_REQUEST,
  message: copy.validation.imageRejected,
} as const;

export interface IAvatarUploadDeps {
  api: typeof api;
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
}

const defaultAvatarDeps: IAvatarUploadDeps = {
  api,
  fetch: (...args) => fetch(...args),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/**
 * Asks the API for a presigned POST, sends the file straight to S3, then
 * polls `users/me` until the avatar-processor Lambda has set a new
 * `avatarUrl`. An image S3 or the Lambda refuses comes back as
 * `imageRejected`.
 */
export async function uploadAvatar(
  file: File,
  currentUrl: string | null,
  deps: Partial<IAvatarUploadDeps> = {},
): Promise<TApiResult<IUser>> {
  const {
    api: callApi,
    fetch: fetchFn,
    sleep,
  } = { ...defaultAvatarDeps, ...deps };
  const input = parseInput(avatarFileSchema, file);
  if (!input.ok) return input;

  const upload = await callApi<AvatarUpload>('users/me/avatar-upload', {
    method: 'POST',
    body: { contentType: file.type },
  });
  if (!upload.ok) return upload;

  const form = new FormData();
  for (const [key, value] of Object.entries(upload.data.fields)) {
    form.append(key, value);
  }
  // Last: S3 ignores form fields after the file.
  form.append('file', file);
  try {
    const res = await fetchFn(upload.data.url, { method: 'POST', body: form });
    if (!res.ok) return avatarRejected;
  } catch (error) {
    console.error(error);
    return { ok: false, status: 0, message: 'Could not reach the server' };
  }

  for (
    let waited = 0;
    waited < AVATAR_POLL_TIMEOUT_MS;
    waited += AVATAR_POLL_INTERVAL_MS
  ) {
    await sleep(AVATAR_POLL_INTERVAL_MS);
    const me = await callApi<IUser>('users/me');
    if (!me.ok) return me;
    if (me.data.avatarUrl && me.data.avatarUrl !== currentUrl) return me;
  }
  return avatarRejected;
}
