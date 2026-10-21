import {
  IPasswordPolicyMessages,
  createConfirmPasswordSchema,
  createPasswordSchema,
  passwordsMatch,
} from '@/app/utils/password-policy';

import { createCodeSchema } from './code.validation';
import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
});

export type TForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const createResetPasswordSchema = (
  messages: IPasswordPolicyMessages & { codeRequired: string },
) =>
  z
    .object({
      code: createCodeSchema(messages.codeRequired),
      password: createPasswordSchema(messages),
      confirmPassword: createConfirmPasswordSchema(messages),
    })
    .refine(...passwordsMatch(messages));

export type TResetPasswordSchema = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
