import {
  EActivityLevel,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';

import { BODY_STATS_LIMITS } from '@/app/(modules)/dashboard/(modules)/profile/constants';
import { TDictionary } from '@/app/providers/dictionary-provider';
import { interpolate } from '@/app/utils/helpers';
import { z } from 'zod';

export const createBodyStatsSchema = ({ validation }: TDictionary) => {
  const { heightCm, weightKg, neckCm, waistCm, hipCm } = BODY_STATS_LIMITS;
  const heightMessage = interpolate(validation.heightRange, heightCm);
  const weightMessage = interpolate(validation.weightRange, weightKg);

  const circumference = (
    limits: { min: number; max: number; step: number },
    rangeMessage: string,
  ) => {
    const message = interpolate(rangeMessage, limits);

    return z
      .number()
      .min(limits.min, { message })
      .max(limits.max, { message })
      .multipleOf(limits.step, { message: validation.halfStep })
      .nullable();
  };

  return z
    .object({
      sex: z.enum(ESex).nullable(),
      heightCm: z
        .number()
        .multipleOf(heightCm.step, { message: validation.wholeNumber })
        .min(heightCm.min, { message: heightMessage })
        .max(heightCm.max, { message: heightMessage })
        .nullable(),
      weightKg: z
        .number()
        .min(weightKg.min, { message: weightMessage })
        .max(weightKg.max, { message: weightMessage })
        .multipleOf(weightKg.step, { message: validation.oneDecimal })
        .nullable(),
      neckCm: circumference(neckCm, validation.neckRange),
      waistCm: circumference(waistCm, validation.waistRange),
      hipCm: circumference(hipCm, validation.hipRange),
      activityLevel: z.enum(EActivityLevel).nullable(),
    })
    .refine(
      ({ neckCm, waistCm }) =>
        neckCm === null || waistCm === null || waistCm > neckCm,
      { message: validation.waistAboveNeck, path: ['waistCm'] },
    );
};

export type TBodyStatsSchema = z.infer<
  ReturnType<typeof createBodyStatsSchema>
>;
