import { z } from 'zod';
import { MAX_MEMBERS, QUANTITY_MAX } from './constants';
import { id, name, positive } from './rules';

/** A Meal ingredient: which Ingredient, and how much of its unit. */
export const mealIngredientSchema = z.strictObject({
  ingredientId: id('ingredientId'),
  quantity: positive('quantity', QUANTITY_MAX),
});
export type MealIngredientInput = z.infer<typeof mealIngredientSchema>;

// Ordered: array position is the Meal ingredient's position
const mealIngredients = z
  .array(mealIngredientSchema, { error: 'mealIngredients must be an array' })
  .min(1, { error: 'Meal must have at least one ingredient' })
  .max(MAX_MEMBERS, { error: `Meal must have at most ${MAX_MEMBERS} ingredients` })
  .refine((items) => new Set(items.map((item) => item.ingredientId)).size === items.length, {
    error: 'Each ingredient may appear only once in a meal',
  });

const fields = { name: name(), mealIngredients };

export const createMealSchema = z.strictObject(fields);
export type CreateMeal = z.infer<typeof createMealSchema>;

export const updateMealSchema = z.strictObject(fields).partial();
export type UpdateMeal = z.infer<typeof updateMealSchema>;

export const MEAL_SORTABLE = ['name', 'createTimeStamp', 'updateTimeStamp'] as const;
