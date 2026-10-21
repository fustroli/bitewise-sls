import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from '@/app/(modules)/dashboard/(modules)/_user/constants';
import { z } from 'zod';

export const avatarFileSchema = z
  .file()
  .min(1)
  .max(MAX_FILE_SIZE)
  .mime(ACCEPTED_IMAGE_TYPES);

export const createEmailChangeSchema = (messages: {
  emailInvalid: string;
  required: string;
}) =>
  z.object({
    newEmail: z.string().min(1, messages.required).email(messages.emailInvalid),
    password: z.string().min(1, messages.required),
  });

export type TEmailChangeSchema = z.infer<
  ReturnType<typeof createEmailChangeSchema>
>;
