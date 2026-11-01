import { ICreateIngredient } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { ICreateMealIngredient } from '@/app/(modules)/dashboard/(modules)/meals/interfaces';

/** A Meal ingredient with its Ingredient's name, nutrients and unit. */
export interface IMealIngredient
  extends ICreateMealIngredient, Omit<ICreateIngredient, 'name'> {
  ingredientName: string;
}
