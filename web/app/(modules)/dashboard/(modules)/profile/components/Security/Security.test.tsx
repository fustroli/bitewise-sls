// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import DeleteAccount from '@/app/(modules)/dashboard/(modules)/profile/components/Profile/DeleteAccount';
import { ESignOutReason } from '@/app/auth/sign-out';
import { IUser } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { ME_KEY } from '@/app/(modules)/dashboard/(modules)/_user/queries';
import { ReactNode } from 'react';
import Security from '@/app/(modules)/dashboard/(modules)/profile/components/Security';
import { TestQueryProvider } from '@/app/utils/testing/test-query-provider';
import { UserProvider } from '@/app/(modules)/dashboard/(modules)/_user/provider';
import { api } from '@/app/lib/api';
import { copy } from '@/app/copy';
import { endSession } from '@/app/auth/sign-out';
import { toast } from '@/app/hooks/use-toast';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/app/lib/api', () => ({ api: vi.fn() }));
vi.mock('@/app/auth/sign-out', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  endSession: vi.fn(),
}));

const amplify = {
  updatePassword: vi.fn(),
  updateUserAttributes: vi.fn(),
  confirmUserAttribute: vi.fn(),
  sendUserAttributeVerificationCode: vi.fn(),
};
vi.mock('aws-amplify/auth', () => ({
  updatePassword: (input: unknown) => amplify.updatePassword(input),
  updateUserAttributes: (input: unknown) => amplify.updateUserAttributes(input),
  confirmUserAttribute: (input: unknown) => amplify.confirmUserAttribute(input),
  sendUserAttributeVerificationCode: (input: unknown) =>
    amplify.sendUserAttributeVerificationCode(input),
}));

const USER: IUser = {
  id: 'user-sub',
  email: 'old@example.com',
  hasPassword: true,
};
const security = copy.profile.security;
const emailText = copy.emailChange;

const renderAs = (ui: ReactNode, user: IUser = USER) =>
  render(
    <TestQueryProvider seed={[[ME_KEY, user]]}>
      <UserProvider actions={{ updateUser: vi.fn() }}>{ui}</UserProvider>
    </TestQueryProvider>,
  );

beforeEach(() => {
  localStorage.clear();
  Object.values(amplify).forEach((fn) => fn.mockReset().mockResolvedValue({}));
  vi.mocked(toast).mockClear();
  vi.mocked(api).mockReset();
  vi.mocked(endSession).mockReset();
});

afterEach(cleanup);

describe('Change password', () => {
  const fill = async (user: ReturnType<typeof userEvent.setup>) => {
    // The section is titled "Password" too, so only inputs count.
    const input = (label: string) =>
      screen.getByLabelText(label, { selector: 'input' });
    await user.type(input(security.oldPassword), 'Old-pass1');
    await user.type(input(security.password), 'New-pass1!');
    await user.type(input(security.confirmPassword), 'New-pass1!');
    await user.click(
      screen.getByRole('button', { name: security.changePassword }),
    );
  };

  it('changes it with Cognito', async () => {
    const user = userEvent.setup();
    renderAs(<Security />);

    await fill(user);

    expect(amplify.updatePassword).toHaveBeenCalledWith({
      oldPassword: 'Old-pass1',
      newPassword: 'New-pass1!',
    });
    expect(toast).toHaveBeenCalledWith({
      variant: 'success',
      description: security.passwordChanged,
    });
  });

  it('names a wrong old password as such', async () => {
    amplify.updatePassword.mockRejectedValue(
      Object.assign(new Error('x'), { name: 'NotAuthorizedException' }),
    );
    const user = userEvent.setup();
    renderAs(<Security />);

    await fill(user);

    expect(toast).toHaveBeenCalledWith({
      variant: 'error',
      description: security.wrongPassword,
    });
  });

  it('is not offered to a Google-only User', () => {
    renderAs(<Security />, { ...USER, hasPassword: false });

    expect(
      screen.queryByRole('button', { name: security.changePassword }),
    ).toBeNull();
    expect(screen.getByText(emailText.managedByGoogle)).toBeTruthy();
  });
});

describe('Change email', () => {
  it('sends a code to the new address, then confirms it', async () => {
    const user = userEvent.setup();
    renderAs(<Security />);

    await user.type(
      screen.getByLabelText(emailText.newEmail),
      'new@example.com',
    );
    await user.click(screen.getByRole('button', { name: emailText.submit }));

    expect(amplify.updateUserAttributes).toHaveBeenCalledWith({
      userAttributes: { email: 'new@example.com' },
    });

    await user.type(await screen.findByLabelText(emailText.code), '111222');
    await user.click(screen.getByRole('button', { name: emailText.confirm }));

    expect(amplify.confirmUserAttribute).toHaveBeenCalledWith({
      userAttributeKey: 'email',
      confirmationCode: '111222',
    });
    // Back to the request form: nothing pending.
    expect(await screen.findByLabelText(emailText.newEmail)).toBeTruthy();
  });

  it('remembers a pending change across visits', async () => {
    localStorage.setItem(
      'bitewise:pending-email:v1:user-sub',
      'new@example.com',
    );
    renderAs(<Security />);

    expect(screen.getByLabelText(emailText.code)).toBeTruthy();
  });
});

describe('Delete account', () => {
  const confirmDelete = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(
      screen.getByRole('button', { name: copy.profile.deleteAccount.title }),
    );
    await user.click(
      screen.getByRole('button', { name: copy.common.continue }),
    );
  };

  it('deletes, then signs out with the reason', async () => {
    vi.mocked(api).mockResolvedValue({ ok: true, data: undefined });
    const user = userEvent.setup();
    renderAs(<DeleteAccount />);

    await confirmDelete(user);

    expect(api).toHaveBeenCalledWith('users/me', { method: 'DELETE' });
    await waitFor(() =>
      expect(endSession).toHaveBeenCalledWith(ESignOutReason.ACCOUNT_DELETED),
    );
  });

  it('stays signed in when the deletion fails', async () => {
    vi.mocked(api).mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Boom',
    });
    const user = userEvent.setup();
    renderAs(<DeleteAccount />);

    await confirmDelete(user);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({
        variant: 'error',
        description: 'Boom',
      }),
    );
    expect(endSession).not.toHaveBeenCalled();
  });
});
