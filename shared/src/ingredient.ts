import { z } from 'zod';
import { NUTRIENT_MAX } from './constants';
import { name, number, oneOf } from './rules';

export const UNITS = ['100g', 'piece'] as const;
export type Unit = (typeof UNITS)[number];

export const NUTRIENTS = [
  'protein',
  'totalFat',
  'saturatedFat',
  'totalCarbohydrates',
  'sugar',
  'dietaryFiber',
  'calories',
] as const;
export type Nutrient = (typeof NUTRIENTS)[number];

const nutrient = (field: Nutrient) => number(field, 0, NUTRIENT_MAX);

const fields = {
  name: name(),
  protein: nutrient('protein'),
  totalFat: nutrient('totalFat'),
  saturatedFat: nutrient('saturatedFat'),
  totalCarbohydrates: nutrient('totalCarbohydrates'),
  sugar: nutrient('sugar'),
  dietaryFiber: nutrient('dietaryFiber'),
  calories: nutrient('calories'),
  unit: oneOf('unit', UNITS),
};

export const FAT_MESSAGE = 'totalFat must be greater than or equal to saturatedFat';

/** Saturated fat is part of total fat. */
export function fatIsConsistent(values: { totalFat: number; saturatedFat: number }): boolean {
  return values.totalFat >= values.saturatedFat;
}

export const createIngredientSchema = z
  .strictObject(fields)
  .refine(fatIsConsistent, { error: FAT_MESSAGE, path: ['totalFat'] });
export type CreateIngredient = z.infer<typeof createIngredientSchema>;

// The fat rule needs both values; on PATCH the API checks it on the merged Ingredient.
export const updateIngredientSchema = z.strictObject(fields).partial();
export type UpdateIngredient = z.infer<typeof updateIngredientSchema>;

export const INGREDIENT_SORTABLE = ['name', ...NUTRIENTS, 'unit', 'createTimeStamp', 'updateTimeStamp'] as const;
