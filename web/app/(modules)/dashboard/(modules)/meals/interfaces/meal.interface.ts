import {
  ICreateMeal,
  IMealIngredient,
} from '@/app/(modules)/dashboard/(modules)/meals/interfaces';

export interface IMeal extends ICreateMeal {
  id: string;
  mealIngredients: IMealIngredient[];
}
