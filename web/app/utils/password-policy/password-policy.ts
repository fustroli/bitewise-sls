import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;

/** Translated messages, from the dictionary's `passwordPolicy`. */
export interface IPasswordPolicyMessages {
  passwordMinLength: string;
  passwordUppercase: string;
  passwordLowercase: string;
  passwordNumberRequired: string;
  passwordRequired: string;
  passwordMatch: string;
  confirmPasswordRequired: string;
}

/** The rules a new password must meet, in display order. */
export const PASSWORD_RULE_KEYS = [
  'passwordMinLength',
  'passwordUppercase',
  'passwordLowercase',
  'passwordNumberRequired',
] as const satisfies readonly (keyof IPasswordPolicyMessages)[];

export const createPasswordSchema = (messages: IPasswordPolicyMessages) =>
  z
    .string()
    .min(1, messages.passwordRequired)
    .min(PASSWORD_MIN_LENGTH, messages.passwordMinLength)
    .regex(/[A-Z]/, messages.passwordUppercase)
    .regex(/[a-z]/, messages.passwordLowercase)
    .regex(/\d/, messages.passwordNumberRequired);

export const createConfirmPasswordSchema = (
  messages: IPasswordPolicyMessages,
) => z.string().min(1, messages.confirmPasswordRequired);

/** Refinement for a schema with `password` and `confirmPassword`. */
export const passwordsMatch = (
  messages: IPasswordPolicyMessages,
): [
  (data: { password: string; confirmPassword: string }) => boolean,
  { message: string; path: string[] },
] => [
  (data) => data.password === data.confirmPassword,
  { message: messages.passwordMatch, path: ['confirmPassword'] },
];
