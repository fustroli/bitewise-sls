'use client';

import {
  ICreateMealPlan,
  IMealPlan,
} from '@/app/(modules)/dashboard/(modules)/meal-plans/interfaces';
import {
  TMealPlanSchema,
  createMealPlanSchema,
} from '@/app/(modules)/dashboard/(modules)/meal-plans/validations';
import {
  createMealPlan,
  deleteMealPlan,
  updateMealPlan,
} from '@/app/(modules)/dashboard/(modules)/meal-plans/queries';

import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { IMealOption } from '@/app/(modules)/dashboard/(modules)/meals/interfaces';
import MealPlanFields from '@/app/(modules)/dashboard/(modules)/meal-plans/components/MealPlanFields';
import { QUERY_KEYS } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import { createResourceForm } from '@/app/(modules)/dashboard/(modules)/_resource-table/components/createResourceForm';

const mealPlanForm = createResourceForm<
  IMealPlan,
  TMealPlanSchema,
  IMealOption[]
>({
  resourceKey: 'mealPlans',
  schema: createMealPlanSchema,
  defaultValues: { name: '', mealIds: [] },
  toFormValues: (mealPlan) => ({
    name: mealPlan.name,
    mealIds: mealPlan.meals.map((meal) => meal.id),
  }),
  fields: MealPlanFields,
  create: createMealPlan,
  update: (values, id) => updateMealPlan(values as ICreateMealPlan, id),
  remove: deleteMealPlan,
  compareType: EComparisonKind.MEAL_PLANS,
  invalidates: [QUERY_KEYS.mealPlans, QUERY_KEYS.statistics],
});

export const MealPlanDialog = mealPlanForm.Dialog;
export const MealPlanRowActions = mealPlanForm.RowActions;
