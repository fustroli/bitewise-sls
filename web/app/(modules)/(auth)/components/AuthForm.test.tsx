// @vitest-environment jsdom
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AuthForm from '@/app/(modules)/(auth)/components/AuthForm';
import { copy } from '@/app/copy';
import { toast } from '@/app/hooks/use-toast';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast }),
}));

const amplify = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendSignUpCode: vi.fn(),
  signInWithRedirect: vi.fn(),
};
vi.mock('aws-amplify/auth', () => ({
  signIn: (input: unknown) => amplify.signIn(input),
  signUp: (input: unknown) => amplify.signUp(input),
  confirmSignUp: (input: unknown) => amplify.confirmSignUp(input),
  resendSignUpCode: (input: unknown) => amplify.resendSignUpCode(input),
  signInWithRedirect: (input: unknown) => amplify.signInWithRedirect(input),
}));

const EMAIL = 'new@example.com';
const PASSWORD = 'Secret-pass1';
const text = copy.emailVerification;

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const signInAs = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Email Address'), EMAIL);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.type(screen.getByLabelText('Password'), PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Sign In' }));
};

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
});

beforeEach(() => {
  Object.values(amplify).forEach((fn) => fn.mockReset());
  vi.mocked(toast).mockClear();
});

afterEach(cleanup);

describe('AuthForm', () => {
  it('signs in with the email as the username', async () => {
    amplify.signIn.mockResolvedValue({ nextStep: { signInStep: 'DONE' } });
    const user = userEvent.setup();
    render(<AuthForm />);

    await signInAs(user);

    expect(amplify.signIn).toHaveBeenCalledWith({
      username: EMAIL,
      password: PASSWORD,
    });
    expect(toast).not.toHaveBeenCalled();
  });

  it('shows a wrong password as Cognito reports it', async () => {
    amplify.signIn.mockRejectedValue(cognitoError('NotAuthorizedException'));
    const user = userEvent.setup();
    render(<AuthForm />);

    await signInAs(user);

    expect(toast).toHaveBeenCalledWith({
      variant: 'error',
      description: copy.auth.errors.incorrectCredentials,
    });
  });

  it('sends an unconfirmed account a code and asks for it', async () => {
    amplify.signIn.mockResolvedValue({
      nextStep: { signInStep: 'CONFIRM_SIGN_UP' },
    });
    amplify.resendSignUpCode.mockResolvedValue({});
    const user = userEvent.setup();
    render(<AuthForm />);

    await signInAs(user);

    expect(await screen.findByText(text.title)).toBeTruthy();
    expect(amplify.resendSignUpCode).toHaveBeenCalledWith({ username: EMAIL });
  });

  it('confirms a new account with the code, then signs in', async () => {
    amplify.signUp.mockResolvedValue({
      nextStep: { signUpStep: 'CONFIRM_SIGN_UP' },
    });
    amplify.confirmSignUp.mockResolvedValue({});
    amplify.signIn.mockResolvedValue({ nextStep: { signInStep: 'DONE' } });
    const user = userEvent.setup();
    render(<AuthForm />);

    await user.click(screen.getByRole('tab', { name: 'Sign Up' }));
    await user.type(screen.getByLabelText('Email Address'), EMAIL);
    await user.type(screen.getByLabelText('Password'), PASSWORD);
    await user.type(screen.getByLabelText('Confirm Password'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    // Sign-up already mailed a code.
    expect(await screen.findByText(text.title)).toBeTruthy();
    expect(amplify.resendSignUpCode).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(text.code), '123456');
    await user.click(screen.getByRole('button', { name: text.confirm }));

    expect(amplify.confirmSignUp).toHaveBeenCalledWith({
      username: EMAIL,
      confirmationCode: '123456',
    });
    expect(amplify.signIn).toHaveBeenCalledWith({
      username: EMAIL,
      password: PASSWORD,
    });
  });

  it("rejects a password Cognito's policy would, before calling it", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);

    await user.click(screen.getByRole('tab', { name: 'Sign Up' }));
    await user.type(screen.getByLabelText('Email Address'), EMAIL);
    await user.type(screen.getByLabelText('Password'), 'Secret-pass');
    await user.type(screen.getByLabelText('Confirm Password'), 'Secret-pass');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(
      await screen.findByText(copy.passwordPolicy.passwordNumberRequired),
    ).toBeTruthy();
    expect(amplify.signUp).not.toHaveBeenCalled();
  });
});
