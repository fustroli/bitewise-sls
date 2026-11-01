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

/** The new address; Cognito mails it a code (no password check, see the handover). */
export const createEmailChangeSchema = (messages: {
  emailInvalid: string;
  required: string;
}) =>
  z.object({
    newEmail: z.string().min(1, messages.required).email(messages.emailInvalid),
  });

/** The code Cognito mailed to the new address; Cognito says if it's right. */
export const createEmailCodeSchema = (required: string) =>
  z.object({ code: z.string().trim().min(1, required) });

export type TEmailCodeSchema = z.infer<
  ReturnType<typeof createEmailCodeSchema>
>;

export type TEmailChangeSchema = z.infer<
  ReturnType<typeof createEmailChangeSchema>
>;
