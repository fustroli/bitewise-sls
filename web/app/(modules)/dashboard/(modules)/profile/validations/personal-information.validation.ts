import { AGE_LIMITS } from '@/app/(modules)/dashboard/(modules)/profile/constants';
import { TDictionary } from '@/app/providers/dictionary-provider';
import { ageOn } from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';
import { interpolate } from '@/app/utils/helpers';
import { z } from 'zod';

export const createPersonalInformationSchema = (
  { validation }: TDictionary,
  today = new Date(),
) =>
  z.object({
    userName: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    /** The phone input sets an emptied number to `null`. */
    phoneNumber: z.string().nullish(),
    dateOfBirth: z
      .date()
      .optional()
      .refine(
        (date) => {
          if (!date) return true;
          const age = ageOn(date, today);
          return age >= AGE_LIMITS.min && age <= AGE_LIMITS.max;
        },
        { message: interpolate(validation.ageRange, AGE_LIMITS) },
      ),
  });

export type TPersonalInfoSchema = z.infer<
  ReturnType<typeof createPersonalInformationSchema>
>;
