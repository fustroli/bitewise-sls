'use client';

import {
  ECalorieTarget,
  EMacroPlan,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';

import { ITargets } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { toastResult } from '@/app/utils/helpers/client';
import { useCallback } from 'react';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

const known = <T extends string>(
  values: Record<string, T>,
  raw: string | null | undefined,
) => Object.values(values).find((value) => value === raw);

/** The stored picks; Maintenance and Balanced when unset or unknown. */
export const parseTargets = (targets?: Partial<ITargets>) => ({
  calorieTarget:
    known(ECalorieTarget, targets?.calorieTarget) ?? ECalorieTarget.MAINTENANCE,
  macroPlan: known(EMacroPlan, targets?.macroPlan) ?? EMacroPlan.BALANCED,
});

/**
 * The Calorie target and Macro plan the User picked on the dashboard, kept
 * on the backend, and `pick` to change them: every reader switches at once,
 * and a failed save switches back with a toast.
 */
export const useTargets = () => {
  const { user, updateTargets } = useUserContext();

  const pick = useCallback(
    async (change: Partial<ITargets>) => {
      toastResult(await updateTargets(change));
    },
    [updateTargets],
  );

  return { ...parseTargets(user.targets), pick };
};
