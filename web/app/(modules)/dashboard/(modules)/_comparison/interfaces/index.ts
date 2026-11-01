import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { INutrition } from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';

/** A record as the Compare page shows it: its Nutrition and its basis. */
export interface IComparisonItem extends INutrition {
  id: string;
  name: string;
  /** Ingredients: what the values are per (`100g` or `piece`). */
  unit?: string;
  /** Meals: their ingredients; Meal plans: their Meals. */
  parts?: number;
}

/** The Compare page's URL state. */
export interface IComparisonQuery {
  kind: EComparisonKind;
  /** One per slot, the baseline first; `null` for an empty slot. */
  ids: (string | null)[];
}
