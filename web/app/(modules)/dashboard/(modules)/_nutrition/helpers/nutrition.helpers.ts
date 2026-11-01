import {
  DISPLAY_DECIMALS,
  EMPTY_NUTRITION,
  GRAMS_PER_UNIT,
  NUTRIENTS,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/constants';
import {
  INutrition,
  INutritionAmount,
  INutritionColumn,
  INutritionMeal,
  INutritionMealPlan,
  TNutrient,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';

import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import { formatAmount } from '@/app/utils/helpers';

const mapNutrition = (value: (nutrient: TNutrient) => number): INutrition =>
  NUTRIENTS.reduce(
    (nutrition, nutrient) => ({ ...nutrition, [nutrient]: value(nutrient) }),
    EMPTY_NUTRITION,
  );

export const scaleNutrition = (nutrition: INutrition, scale: number) =>
  mapNutrition((nutrient) => nutrition[nutrient] * scale);

export const sumNutrition = (items: INutrition[]) =>
  items.reduce(
    (total, item) =>
      mapNutrition((nutrient) => total[nutrient] + item[nutrient]),
    EMPTY_NUTRITION,
  );

/** Quantity is grams for 100 g Ingredients and a count for piece Ingredients. */
export const mealIngredientNutrition = (
  mealIngredient: INutritionAmount,
): INutrition =>
  scaleNutrition(
    mealIngredient,
    mealIngredient.unit === EUnit.PIECE
      ? mealIngredient.quantity
      : mealIngredient.quantity / GRAMS_PER_UNIT,
  );

export const mealNutrition = (meal: INutritionMeal): INutrition =>
  sumNutrition(meal.mealIngredients.map(mealIngredientNutrition));

export const mealPlanNutrition = (mealPlan: INutritionMealPlan): INutrition =>
  sumNutrition(mealPlan.meals.map(mealNutrition));

/**
 * A column's amounts, rounded only for display (up to one decimal, in the
 * locale): e.g. `{ value: '12.5', sub: '3.1' }` for fat and saturated fat.
 */
export const formatNutrition = (
  nutrition: INutrition,
  { nutrient, subNutrient }: INutritionColumn,
  locale: string,
) => ({
  value: formatAmount(nutrition[nutrient], locale, DISPLAY_DECIMALS),
  sub:
    subNutrient &&
    formatAmount(nutrition[subNutrient], locale, DISPLAY_DECIMALS),
});
