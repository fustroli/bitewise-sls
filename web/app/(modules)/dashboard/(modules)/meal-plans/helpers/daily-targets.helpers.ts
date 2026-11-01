import { EMacroPlan } from '@/app/(modules)/dashboard/(modules)/_user/enums';
import { IBodyMetrics } from '@/app/(modules)/dashboard/(modules)/_body-metrics/interfaces';
import { IDailyTargets } from '@/app/(modules)/dashboard/(modules)/meal-plans/interfaces';
import { ON_TARGET_KCAL } from '@/app/(modules)/dashboard/(modules)/meal-plans/constants';

/**
 * The day's targets at the Calorie target `metrics` were computed for;
 * unset while it can't be computed.
 */
export const dailyTargets = (
  { calories, macros }: IBodyMetrics,
  planName: EMacroPlan = EMacroPlan.BALANCED,
): IDailyTargets | undefined => {
  const plan = macros?.plans.find((option) => option.plan === planName);
  if (!calories || !macros || !plan) return undefined;

  return {
    target: calories.target,
    safeMinimum: calories.safeMinimum,
    plan: planName,
    calories: calories.target.kcalPerDay,
    protein: plan.protein.grams,
    totalFat: plan.fat.grams,
    totalCarbohydrates: plan.carbs.grams,
    saturatedFat: macros.saturatedFatMaxGrams,
    sugar: macros.sugarMaxGrams,
  };
};

/** A day's calories against a target: the signed gap, and if it's close. */
export const calorieGap = (kcal: number, target: number) => {
  const diff = kcal - target;
  return { diff, onTarget: Math.abs(Math.round(diff)) <= ON_TARGET_KCAL };
};
