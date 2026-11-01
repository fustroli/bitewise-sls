'use client';

import {
  ICreateIngredient,
  IIngredient,
} from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import {
  TIngredientSchema,
  createIngredientSchema,
} from '@/app/(modules)/dashboard/(modules)/ingredients/validations';
import {
  createIngredient,
  deleteIngredient,
  updateIngredient,
} from '@/app/(modules)/dashboard/(modules)/ingredients/queries';

import { DEFAULT_INGREDIENT_VALUES } from '@/app/(modules)/dashboard/(modules)/ingredients/constants';
import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import IngredientFields from '@/app/(modules)/dashboard/(modules)/ingredients/components/IngredientFields';
import { QUERY_KEYS } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import { createResourceForm } from '@/app/(modules)/dashboard/(modules)/_resource-table/components/createResourceForm';

const ingredientForm = createResourceForm<IIngredient, TIngredientSchema>({
  resourceKey: 'ingredients',
  schema: createIngredientSchema,
  defaultValues: DEFAULT_INGREDIENT_VALUES,
  toFormValues: (ingredient) => ({
    name: ingredient.name,
    protein: ingredient.protein,
    totalFat: ingredient.totalFat,
    saturatedFat: ingredient.saturatedFat,
    totalCarbohydrates: ingredient.totalCarbohydrates,
    sugar: ingredient.sugar,
    dietaryFiber: ingredient.dietaryFiber,
    calories: ingredient.calories,
    unit: ingredient.unit,
  }),
  fields: IngredientFields,
  create: (values) => createIngredient(values as ICreateIngredient),
  update: (values, id) => updateIngredient(values as ICreateIngredient, id),
  remove: deleteIngredient,
  compareType: EComparisonKind.INGREDIENTS,
  // An Ingredient's values show in its Meals and their Meal plans.
  invalidates: [
    QUERY_KEYS.ingredients,
    QUERY_KEYS.meals,
    QUERY_KEYS.mealPlans,
    QUERY_KEYS.statistics,
  ],
});

export const IngredientDialog = ingredientForm.Dialog;
export const IngredientRowActions = ingredientForm.RowActions;
