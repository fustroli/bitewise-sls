import { ICreateMealIngredient } from '@/app/(modules)/dashboard/(modules)/meals/interfaces';

export interface ICreateMeal {
  name: string;
  mealIngredients: ICreateMealIngredient[];
}
