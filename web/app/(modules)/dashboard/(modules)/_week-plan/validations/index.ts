import {
  DAYS_PER_WEEK,
  WEEK_PLAN_STORAGE_VERSION,
} from '@/app/(modules)/dashboard/(modules)/_week-plan/constants';
import { storedLineSchema } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { z } from 'zod';

/** What localStorage holds: Monday to Sunday, each day's lines as edited. */
export const storedWeekSchema = z.object({
  version: z.literal(WEEK_PLAN_STORAGE_VERSION),
  days: z.array(z.array(storedLineSchema)).length(DAYS_PER_WEEK),
});

export type TStoredWeek = z.infer<typeof storedWeekSchema>;
