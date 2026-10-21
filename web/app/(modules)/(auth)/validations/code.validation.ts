import { z } from 'zod';

/** A code Cognito mailed; Cognito itself says whether it's right. */
export const createCodeSchema = (required: string) =>
  z.string().trim().min(1, required);

export const createConfirmSignUpSchema = (required: string) =>
  z.object({ code: createCodeSchema(required) });

export type TConfirmSignUpSchema = z.infer<
  ReturnType<typeof createConfirmSignUpSchema>
>;
