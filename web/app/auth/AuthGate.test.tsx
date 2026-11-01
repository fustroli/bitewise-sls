// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AuthGate from '@/app/auth/AuthGate';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const getCurrentUser = vi.fn();
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: () => getCurrentUser(),
}));

// The Hub listener the gate registers, to fire auth events at it.
let emit: (event: string) => void = () => {};
vi.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: (
      _: string,
      listener: (data: { payload: { event: string } }) => void,
    ) => {
      emit = (event) => listener({ payload: { event } });
      return () => {};
    },
  },
}));

const signedIn = () => getCurrentUser.mockResolvedValue({ userId: 'sub' });
const signedOut = () => getCurrentUser.mockRejectedValue(new Error('none'));

const renderGate = (forSignedIn: boolean) =>
  render(
    <AuthGate signedIn={forSignedIn}>
      <p>page</p>
    </AuthGate>,
  );

beforeEach(() => {
  replace.mockClear();
});

afterEach(cleanup);

describe('AuthGate', () => {
  it('shows the dashboard to a signed-in User', async () => {
    signedIn();
    renderGate(true);

    expect(await screen.findByText('page')).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it('sends a signed-out visitor from the dashboard to sign-in, showing nothing', async () => {
    signedOut();
    renderGate(true);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(screen.queryByText('page')).toBeNull();
  });

  it('sends a signed-in User from sign-in to the dashboard', async () => {
    signedIn();
    renderGate(false);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard/'));
  });

  it('follows a sign-in as it happens, e.g. Google coming back', async () => {
    signedOut();
    renderGate(false);
    expect(await screen.findByText('page')).toBeTruthy();

    act(() => emit('signInWithRedirect'));

    expect(replace).toHaveBeenCalledWith('/dashboard/');
    expect(screen.queryByText('page')).toBeNull();
  });

  it('leaves the dashboard on sign-out', async () => {
    signedIn();
    renderGate(true);
    expect(await screen.findByText('page')).toBeTruthy();

    act(() => emit('signedOut'));

    expect(replace).toHaveBeenCalledWith('/');
  });
});
