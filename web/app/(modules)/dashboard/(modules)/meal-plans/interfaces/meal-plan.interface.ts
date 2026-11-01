import { ICreateMealPlan } from '@/app/(modules)/dashboard/(modules)/meal-plans/interfaces';
import { IMeal } from '@/app/(modules)/dashboard/(modules)/meals/interfaces';

export interface IMealPlan extends ICreateMealPlan {
  id: string;
  meals: IMeal[];
}
