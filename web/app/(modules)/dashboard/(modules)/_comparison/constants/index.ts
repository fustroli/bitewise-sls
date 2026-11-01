import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { TNutrient } from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';

/** Slots: the baseline and two more. */
export const COMPARISON_MAX_ITEMS = 3;

/** The page's kinds, in the switch's order; the first is the default. */
export const COMPARISON_KINDS: EComparisonKind[] = [
  EComparisonKind.INGREDIENTS,
  EComparisonKind.MEALS,
  EComparisonKind.MEAL_PLANS,
];

export interface IComparisonNutrient {
  nutrient: TNutrient;
  unit: 'kcal' | 'g';
  /** Shown indented under the nutrient before it. */
  sub?: boolean;
  /** The bars' `bg-*` class. */
  barClassName: string;
}

/** The nutrient-by-nutrient rows, in order. */
export const COMPARISON_NUTRIENTS: IComparisonNutrient[] = [
  { nutrient: 'calories', unit: 'kcal', barClassName: 'bg-foreground' },
  { nutrient: 'protein', unit: 'g', barClassName: 'bg-protein' },
  { nutrient: 'totalCarbohydrates', unit: 'g', barClassName: 'bg-carbs' },
  { nutrient: 'sugar', unit: 'g', sub: true, barClassName: 'bg-carbs' },
  { nutrient: 'totalFat', unit: 'g', barClassName: 'bg-fat' },
  { nutrient: 'saturatedFat', unit: 'g', sub: true, barClassName: 'bg-fat' },
  { nutrient: 'dietaryFiber', unit: 'g', barClassName: 'bg-fiber' },
];

/** Decimals shown per unit: whole kcal, grams to one decimal. */
export const COMPARISON_DECIMALS = { kcal: 0, g: 1 };
