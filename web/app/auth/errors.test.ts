import { describe, expect, it } from 'vitest';

import { authErrorMessage } from './errors';
import { copy } from '@/app/copy';

const text = copy.auth.errors;

const cognitoError = (name: string, message = '') =>
  Object.assign(new Error(message), { name });

describe('authErrorMessage', () => {
  it.each([
    ['NotAuthorizedException', text.incorrectCredentials],
    ['UsernameExistsException', text.emailTaken],
    ['CodeMismatchException', text.codeMismatch],
    ['ExpiredCodeException', text.codeExpired],
    ['LimitExceededException', text.throttled],
    ['TooManyRequestsException', text.throttled],
    ['TooManyFailedAttemptsException', text.throttled],
  ])('maps %s', (name, message) => {
    expect(authErrorMessage(cognitoError(name, 'raw'))).toBe(message);
  });

  it("strips the pre-sign-up trigger's prefix", () => {
    const error = cognitoError(
      'UserLambdaValidationException',
      'PreSignUp failed with error Email already in use.',
    );

    expect(authErrorMessage(error)).toBe('Email already in use.');
  });

  it("passes Cognito's password policy message through", () => {
    const message =
      'Password does not conform to policy: Password must have symbol characters';

    expect(
      authErrorMessage(cognitoError('InvalidPasswordException', message)),
    ).toBe(message);
  });

  it.each([cognitoError('NetworkError', 'fetch failed'), 'oops', undefined])(
    'falls back to the generic message for %j',
    (error) => {
      expect(authErrorMessage(error)).toBe(text.failed);
    },
  );
});
