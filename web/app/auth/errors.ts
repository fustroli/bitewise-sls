import { copy } from '@/app/copy';

const text = copy.auth.errors;

// Cognito exceptions (Amplify keeps the name) and the copy shown for them.
const MESSAGES: Record<string, string> = {
  NotAuthorizedException: text.incorrectCredentials,
  UsernameExistsException: text.emailTaken,
  // An email change to an address another account signs in with.
  AliasExistsException: text.emailTaken,
  CodeMismatchException: text.codeMismatch,
  ExpiredCodeException: text.codeExpired,
  LimitExceededException: text.throttled,
  TooManyRequestsException: text.throttled,
  TooManyFailedAttemptsException: text.throttled,
};

// Cognito prefixes a trigger's error with this.
const PRE_SIGN_UP_PREFIX = 'PreSignUp failed with error ';

/**
 * The text to show for an error thrown by an Amplify Auth call. `overrides`
 * word an exception for the caller's context, e.g. a wrong old password.
 */
export function authErrorMessage(
  error: unknown,
  overrides: Record<string, string> = {},
): string {
  if (!(error instanceof Error)) return text.failed;
  if (overrides[error.name]) return overrides[error.name];

  if (error.name === 'UserLambdaValidationException') {
    return error.message.replace(PRE_SIGN_UP_PREFIX, '');
  }
  // Names the unmet rule, e.g. "Password must have symbol characters".
  if (error.name === 'InvalidPasswordException') return error.message;

  return MESSAGES[error.name] ?? text.failed;
}
