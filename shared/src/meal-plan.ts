import { z } from 'zod';
import { MAX_MEMBERS } from './constants';
import { name, ULID } from './rules';

// Ordered: array position is the Meal's position in the plan
const mealIds = z
  .array(z.string(), { error: 'mealIds must be an array' })
  .min(1, { error: 'Meal plan must have at least one meal' })
  .max(MAX_MEMBERS, { error: `Meal plan must have at most ${MAX_MEMBERS} meals` })
  .refine((ids) => ids.every((id) => ULID.test(id)), { error: 'each value in mealIds must be a ULID' })
  .refine((ids) => new Set(ids).size === ids.length, { error: 'Each meal may appear only once in a meal plan' });

const fields = { name: name(), mealIds };

export const createMealPlanSchema = z.strictObject(fields);
export type CreateMealPlan = z.infer<typeof createMealPlanSchema>;

export const updateMealPlanSchema = z.strictObject(fields).partial();
export type UpdateMealPlan = z.infer<typeof updateMealPlanSchema>;

export const MEAL_PLAN_SORTABLE = ['name', 'createTimeStamp', 'updateTimeStamp'] as const;
