// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ForgotPassword from '@/app/(modules)/(auth)/components/ForgotPassword';
import { copy } from '@/app/copy';
import { toast } from '@/app/hooks/use-toast';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast }),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('email=me%40example.com'),
}));

const amplify = {
  resetPassword: vi.fn(),
  confirmResetPassword: vi.fn(),
  signIn: vi.fn(),
};
vi.mock('aws-amplify/auth', () => ({
  resetPassword: (input: unknown) => amplify.resetPassword(input),
  confirmResetPassword: (input: unknown) => amplify.confirmResetPassword(input),
  signIn: (input: unknown) => amplify.signIn(input),
}));

const text = copy.passwordReset;
const NEW_PASSWORD = 'Fresh-pass1';

beforeEach(() => {
  Object.values(amplify).forEach((fn) => fn.mockReset().mockResolvedValue({}));
  vi.mocked(toast).mockClear();
});

afterEach(cleanup);

describe('ForgotPassword', () => {
  it('mails a code to the address from the sign-in form, then resets and signs in', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);

    await user.click(screen.getByRole('button', { name: text.sendCode }));
    expect(amplify.resetPassword).toHaveBeenCalledWith({
      username: 'me@example.com',
    });

    await user.type(await screen.findByLabelText(text.code), '654321');
    await user.type(screen.getByLabelText(text.newPassword), NEW_PASSWORD);
    await user.type(screen.getByLabelText(text.confirmPassword), NEW_PASSWORD);
    await user.click(screen.getByRole('button', { name: text.updatePassword }));

    expect(amplify.confirmResetPassword).toHaveBeenCalledWith({
      username: 'me@example.com',
      confirmationCode: '654321',
      newPassword: NEW_PASSWORD,
    });
    expect(amplify.signIn).toHaveBeenCalledWith({
      username: 'me@example.com',
      password: NEW_PASSWORD,
    });
  });

  it('keeps the form on a wrong code and says so', async () => {
    amplify.confirmResetPassword.mockRejectedValue(
      Object.assign(new Error('x'), { name: 'CodeMismatchException' }),
    );
    const user = userEvent.setup();
    render(<ForgotPassword />);

    await user.click(screen.getByRole('button', { name: text.sendCode }));
    await user.type(await screen.findByLabelText(text.code), '000000');
    await user.type(screen.getByLabelText(text.newPassword), NEW_PASSWORD);
    await user.type(screen.getByLabelText(text.confirmPassword), NEW_PASSWORD);
    await user.click(screen.getByRole('button', { name: text.updatePassword }));

    expect(toast).toHaveBeenCalledWith({
      variant: 'error',
      description: copy.auth.errors.codeMismatch,
    });
    expect(amplify.signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(text.code)).toBeTruthy();
  });
});
