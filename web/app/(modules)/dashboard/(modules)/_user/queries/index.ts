import {
  IUser,
  IUserChange,
} from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { api, unwrap } from '@/app/lib/api';

import { TApiResult } from '@/app/utils/interfaces';
import { profilePatchSchema } from '@bitewise/shared';
import { queryOptions } from '@tanstack/react-query';

const HTTP_BAD_REQUEST = 400;

export const ME_KEY = ['me'] as const;

export const meQuery = queryOptions({
  queryKey: ME_KEY,
  queryFn: async () => unwrap(await api<IUser>('users/me')),
});

/** Saves part of the Profile; checked with the API's own schema first. */
export async function updateUser(
  change: IUserChange,
): Promise<TApiResult<IUser>> {
  const input = profilePatchSchema.safeParse(change);
  if (!input.success) {
    return {
      ok: false,
      status: HTTP_BAD_REQUEST,
      message: input.error.issues.map((issue) => issue.message).join(', '),
    };
  }

  return api<IUser>('users/me', { method: 'PATCH', body: input.data });
}
