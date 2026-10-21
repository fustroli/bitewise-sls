import { ESignInSteps } from '@/app/(modules)/(auth)/enum';
import { z } from 'zod';

const step1Schema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
});

const step2Schema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const signinSchema = (step: ESignInSteps) =>
  step === ESignInSteps.STEP_0 ? step1Schema : step2Schema;

export type TSignInSchema = z.infer<typeof step1Schema | typeof step2Schema>;
