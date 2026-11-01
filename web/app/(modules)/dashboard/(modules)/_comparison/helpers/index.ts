import {
  COMPARISON_KINDS,
  COMPARISON_MAX_ITEMS,
} from '@/app/(modules)/dashboard/(modules)/_comparison/constants';
import {
  IComparisonItem,
  IComparisonQuery,
} from '@/app/(modules)/dashboard/(modules)/_comparison/interfaces';
import {
  INutritionMeal,
  INutritionMealPlan,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';
import {
  mealNutrition,
  mealPlanNutrition,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/helpers';

import { ULID } from '@bitewise/shared';

type TParam = string | string[] | undefined;

const first = (value: TParam) => (Array.isArray(value) ? value[0] : value);

const toId = (value: string) => (ULID.test(value) ? value : null);

/**
 * Reads `?type=…&ids=4,,7`: an unknown type is the first kind, ids past the
 * third are dropped, and anything that isn't an id is an empty slot.
 */
export const parseComparisonQuery = (params: {
  type?: TParam;
  ids?: TParam;
}): IComparisonQuery => {
  const type = first(params.type);
  const kind =
    COMPARISON_KINDS.find((option) => option === type) ?? COMPARISON_KINDS[0];
  const ids = (first(params.ids) ?? '')
    .split(',')
    .slice(0, COMPARISON_MAX_ITEMS)
    .map((value) => toId(value.trim()));

  return { kind, ids: ids.some((id) => id !== null) ? ids : [] };
};

/** The query for a kind and its slots; empty slots at the end are left out. */
export const comparisonSearch = ({ kind, ids }: IComparisonQuery) => {
  const slots = [...ids];
  while (slots.length && slots.at(-1) === null) slots.pop();
  const query = new URLSearchParams({ type: kind });
  if (slots.length) query.set('ids', slots.map((id) => id ?? '').join(','));
  return `?${query}`;
};

/**
 * A value's difference from the baseline's, rounded like the values:
 * `+12.3 g`, `−200 kcal`, or `same` when it rounds to nothing.
 */
export const formatDelta = (
  diff: number,
  unit: string,
  decimals: number,
  locale: string,
  same: string,
) => {
  const rounded = Number(diff.toFixed(decimals));
  if (rounded === 0) return same;

  const amount = Math.abs(rounded).toLocaleString(locale, {
    maximumFractionDigits: decimals,
  });
  // A real minus sign, not a hyphen.
  return `${rounded > 0 ? '+' : '−'}${amount} ${unit}`;
};

export const ingredientItem = (
  ingredient: IComparisonItem & { unit: string },
): IComparisonItem => ({
  id: ingredient.id,
  name: ingredient.name,
  unit: ingredient.unit,
  calories: ingredient.calories,
  protein: ingredient.protein,
  totalFat: ingredient.totalFat,
  saturatedFat: ingredient.saturatedFat,
  totalCarbohydrates: ingredient.totalCarbohydrates,
  sugar: ingredient.sugar,
  dietaryFiber: ingredient.dietaryFiber,
});

export const mealItem = (
  meal: { id: string; name: string } & INutritionMeal,
): IComparisonItem => ({
  id: meal.id,
  name: meal.name,
  parts: meal.mealIngredients.length,
  ...mealNutrition(meal),
});

export const mealPlanItem = (
  mealPlan: { id: string; name: string } & INutritionMealPlan,
): IComparisonItem => ({
  id: mealPlan.id,
  name: mealPlan.name,
  parts: mealPlan.meals.length,
  ...mealPlanNutrition(mealPlan),
});
