import {
  INutrition,
  INutritionColumn,
  TNutrient,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';

export const NUTRIENTS: TNutrient[] = [
  'calories',
  'protein',
  'totalFat',
  'saturatedFat',
  'totalCarbohydrates',
  'sugar',
  'dietaryFiber',
];

export const EMPTY_NUTRITION: INutrition = {
  calories: 0,
  protein: 0,
  totalFat: 0,
  saturatedFat: 0,
  totalCarbohydrates: 0,
  sugar: 0,
  dietaryFiber: 0,
};

/** Grams that a 100 g Unit refers to. */
export const GRAMS_PER_UNIT = 100;

export const DISPLAY_DECIMALS = 1;

export const NUTRITION_COLUMNS: INutritionColumn[] = [
  { nutrient: 'calories', unit: 'kcal' },
  { nutrient: 'protein', unit: 'g', swatch: 'protein' },
  {
    nutrient: 'totalCarbohydrates',
    subNutrient: 'sugar',
    unit: 'g',
    swatch: 'carbs',
  },
  {
    nutrient: 'totalFat',
    subNutrient: 'saturatedFat',
    unit: 'g',
    swatch: 'fat',
  },
  { nutrient: 'dietaryFiber', unit: 'g' },
];
