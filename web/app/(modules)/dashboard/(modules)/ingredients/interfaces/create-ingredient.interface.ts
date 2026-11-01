import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';

export interface ICreateIngredient {
  name: string;
  protein: number;
  totalFat: number;
  saturatedFat: number;
  totalCarbohydrates: number;
  sugar: number;
  dietaryFiber: number;
  calories: number;
  unit: EUnit;
}
