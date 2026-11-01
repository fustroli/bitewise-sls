// @vitest-environment jsdom
import {
  ESignOutReason,
  clearSignOutReason,
  endSession,
  readSignOutReason,
} from '@/app/auth/sign-out';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signOut = vi.fn(async () => {});
vi.mock('aws-amplify/auth', () => ({ signOut: () => signOut() }));

beforeEach(() => {
  sessionStorage.clear();
  signOut.mockClear();
});

describe('sign-out reason', () => {
  it('survives the sign-out until the sign-in page shows it', async () => {
    await endSession(ESignOutReason.EXPIRED);

    expect(signOut).toHaveBeenCalledOnce();
    expect(readSignOutReason()).toBe(ESignOutReason.EXPIRED);

    clearSignOutReason();
    expect(readSignOutReason()).toBeUndefined();
  });

  it('stores nothing for a plain sign-out', async () => {
    await endSession();

    expect(readSignOutReason()).toBeUndefined();
  });

  it('ignores a value it did not write', () => {
    sessionStorage.setItem('bitewise:sign-out-reason', '<b>hi</b>');

    expect(readSignOutReason()).toBeUndefined();
  });
});
