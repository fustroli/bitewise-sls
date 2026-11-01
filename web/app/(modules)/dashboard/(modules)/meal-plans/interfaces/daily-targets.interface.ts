import { EMacroPlan } from '@/app/(modules)/dashboard/(modules)/_user/enums';
import { ICalorieTarget } from '@/app/(modules)/dashboard/(modules)/_body-metrics/interfaces';

/**
 * One day at the User's Calorie target, split by their Macro plan, full
 * precision.
 */
export interface IDailyTargets {
  /** The picked Calorie target, which `calories` is. */
  target: ICalorieTarget;
  /** The safe minimum for the User's sex, in kcal/day. */
  safeMinimum: number;
  plan: EMacroPlan;
  calories: number;
  protein: number;
  totalFat: number;
  totalCarbohydrates: number;
  /** Caps: stay under these. */
  saturatedFat: number;
  sugar: number;
}
