'use client';

import {
  ICreateMeal,
  IMeal,
} from '@/app/(modules)/dashboard/(modules)/meals/interfaces';
import {
  TMealSchema,
  createMealSchema,
} from '@/app/(modules)/dashboard/(modules)/meals/validations';
import {
  createMeal,
  deleteMeal,
  updateMeal,
} from '@/app/(modules)/dashboard/(modules)/meals/queries';

import { DEFAULT_MEAL } from '@/app/(modules)/dashboard/(modules)/meals/constants';
import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { IIngredientOption } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import MealFields from '@/app/(modules)/dashboard/(modules)/meals/components/MealFields';
import { QUERY_KEYS } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import { createResourceForm } from '@/app/(modules)/dashboard/(modules)/_resource-table/components/createResourceForm';

const mealForm = createResourceForm<IMeal, TMealSchema, IIngredientOption[]>({
  resourceKey: 'meals',
  schema: createMealSchema,
  defaultValues: DEFAULT_MEAL,
  toFormValues: (meal) => ({
    name: meal.name,
    mealIngredients: meal.mealIngredients.map(({ ingredientId, quantity }) => ({
      ingredientId,
      quantity,
    })),
  }),
  fields: MealFields,
  create: createMeal,
  update: (values, id) => updateMeal(values as ICreateMeal, id),
  remove: deleteMeal,
  compareType: EComparisonKind.MEALS,
  // A Meal's values show in its Meal plans.
  invalidates: [QUERY_KEYS.meals, QUERY_KEYS.mealPlans, QUERY_KEYS.statistics],
});

export const MealDialog = mealForm.Dialog;
export const MealRowActions = mealForm.RowActions;
