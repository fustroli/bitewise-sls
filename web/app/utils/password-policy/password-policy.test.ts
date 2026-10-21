import { describe, expect, it } from 'vitest';

import { createPasswordSchema } from './password-policy';
import { copy as en } from '@/app/copy';

const messages = en.passwordPolicy;
const schema = createPasswordSchema(messages);

const firstError = (password: string) => {
  const result = schema.safeParse(password);
  return result.success ? undefined : result.error.issues[0].message;
};

describe('password policy', () => {
  it.each(['Password1!', 'abcDEF1_', 'Zz34567=', 'Long Passphrase 2024'])(
    'accepts %j',
    (password) => {
      expect(firstError(password)).toBeUndefined();
    },
  );

  it.each([
    ['', messages.passwordRequired],
    ['Pass1', messages.passwordMinLength],
    ['password1', messages.passwordUppercase],
    ['PASSWORD1', messages.passwordLowercase],
    ['Password!', messages.passwordNumberRequired],
    ['Password1', messages.passwordSymbol],
    // Cognito counts only ASCII symbols.
    ['Passwörd1', messages.passwordSymbol],
  ])('rejects %j with %j', (password, message) => {
    expect(firstError(password)).toBe(message);
  });
});
