'use client';

import {
  useBodyMetrics,
  useTargets,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/hooks';

import { dailyTargets } from '@/app/(modules)/dashboard/(modules)/meal-plans/helpers';

/**
 * The User's daily targets at the Calorie target and Macro plan picked on
 * the dashboard; unset while they can't be computed.
 */
export const useDailyTargets = () => {
  const { macroPlan } = useTargets();

  return dailyTargets(useBodyMetrics(), macroPlan);
};
