'use client';

import { bodyMetrics } from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';
import { useTargets } from '@/app/(modules)/dashboard/(modules)/_body-metrics/hooks/use-targets';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

/** The User's Body metrics today, at their picked Calorie target. */
export const useBodyMetrics = () => {
  const { user } = useUserContext();
  const { calorieTarget } = useTargets();

  return bodyMetrics({
    bodyStats: user.bodyStats,
    dateOfBirth: user.personalInformation?.dateOfBirth,
    calorieTarget,
    today: new Date(),
  });
};
