import {
  IAvatarUploadDeps,
  uploadAvatar,
} from '@/app/(modules)/dashboard/(modules)/_user/queries';
import { describe, expect, it, vi } from 'vitest';

import { IUser } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { TApiResult } from '@/app/utils/interfaces';
import { copy } from '@/app/copy';

vi.mock('@/app/lib/api', () => ({ api: vi.fn(), unwrap: vi.fn() }));

const OLD = 'https://app.example/avatars/sub/old.webp';
const NEW = 'https://app.example/avatars/sub/new.webp';
const photo = () => new File(['jpeg'], 'me.jpg', { type: 'image/jpeg' });
const me = (avatarUrl: string | null): TApiResult<IUser> => ({
  ok: true,
  data: { id: 'sub', email: 'a@example.com', avatarUrl },
});

/** The API answers the presign, then each `users/me` poll in turn. */
function fakes(polls: TApiResult<IUser>[], s3Status = 204) {
  const api = vi.fn(async (path: string) => {
    if (path === 'users/me/avatar-upload') {
      return {
        ok: true,
        data: {
          url: 'https://bucket.s3.example.com/',
          fields: { key: 'uploads/sub/01ID', 'Content-Type': 'image/jpeg' },
        },
      };
    }
    return polls.shift() ?? me(OLD);
  });
  const fetch = vi.fn(async () => new Response(null, { status: s3Status }));
  const sleep = vi.fn(async () => {});
  return { api, fetch, sleep } as unknown as IAvatarUploadDeps & {
    api: typeof api;
    fetch: typeof fetch;
  };
}

describe('uploadAvatar', () => {
  it('presigns, posts the fields then the file to S3, and waits for the new avatar', async () => {
    const deps = fakes([me(OLD), me(NEW)]);
    const file = photo();

    const result = await uploadAvatar(file, OLD, deps);

    expect(result).toEqual(me(NEW));
    expect(deps.api).toHaveBeenCalledWith('users/me/avatar-upload', {
      method: 'POST',
      body: { contentType: 'image/jpeg' },
    });
    const [url, init] = deps.fetch.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://bucket.s3.example.com/');
    const form = init.body as FormData;
    expect([...form.keys()]).toEqual(['key', 'Content-Type', 'file']);
    expect(form.get('file')).toBe(file);
  });

  it('a file S3 refuses is rejected without polling', async () => {
    const deps = fakes([], 400);

    expect(await uploadAvatar(photo(), OLD, deps)).toMatchObject({
      ok: false,
      message: copy.validation.imageRejected,
    });
    expect(deps.api).toHaveBeenCalledTimes(1);
  });

  it('no new avatar before the timeout means the image was rejected', async () => {
    const deps = fakes([]);

    expect(await uploadAvatar(photo(), OLD, deps)).toMatchObject({
      ok: false,
      message: copy.validation.imageRejected,
    });
    expect(deps.sleep).toHaveBeenCalledTimes(20);
  });

  it('other types never reach the API', async () => {
    const deps = fakes([]);
    const gif = new File(['gif'], 'a.gif', { type: 'image/gif' });

    expect((await uploadAvatar(gif, OLD, deps)).ok).toBe(false);
    expect(deps.api).not.toHaveBeenCalled();
  });
});
