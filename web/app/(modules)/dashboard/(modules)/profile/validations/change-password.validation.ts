import {
  IPasswordPolicyMessages,
  createConfirmPasswordSchema,
  createPasswordSchema,
  passwordsMatch,
} from '@/app/utils/password-policy';
import { z } from 'zod';

export const createChangePasswordSchema = (
  messages: IPasswordPolicyMessages & { oldPasswordRequired: string },
) =>
  z
    .object({
      oldPassword: z.string().min(1, messages.oldPasswordRequired),
      password: createPasswordSchema(messages),
      confirmPassword: createConfirmPasswordSchema(messages),
    })
    .refine(...passwordsMatch(messages));

export type TChangePasswordSchema = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>;
