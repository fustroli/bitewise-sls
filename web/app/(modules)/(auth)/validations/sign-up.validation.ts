import {
  IPasswordPolicyMessages,
  createConfirmPasswordSchema,
  createPasswordSchema,
  passwordsMatch,
} from '@/app/utils/password-policy';
import { z } from 'zod';

export const createSignupSchema = (messages: IPasswordPolicyMessages) =>
  z
    .object({
      email: z
        .string()
        .email('Invalid email address')
        .min(1, 'Email is required'),
      password: createPasswordSchema(messages),
      confirmPassword: createConfirmPasswordSchema(messages),
    })
    .refine(...passwordsMatch(messages));

export type TSignupSchema = z.infer<ReturnType<typeof createSignupSchema>>;
