import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';

export interface INutrition {
  calories: number;
  protein: number;
  totalFat: number;
  saturatedFat: number;
  totalCarbohydrates: number;
  sugar: number;
  dietaryFiber: number;
}

export type TNutrient = keyof INutrition;

/** An Ingredient's Nutrition per Unit, with the quantity used of it. */
export interface INutritionAmount extends INutrition {
  unit: EUnit;
  quantity: number;
}

export interface INutritionMeal {
  mealIngredients: INutritionAmount[];
}

export interface INutritionMealPlan {
  meals: INutritionMeal[];
}

/** One displayed Nutrition column, e.g. fat with saturated fat under it. */
export interface INutritionColumn {
  nutrient: TNutrient;
  subNutrient?: 'sugar' | 'saturatedFat';
  unit: string;
  /** The macro colour square on its header. */
  swatch?: 'protein' | 'carbs' | 'fat';
}
