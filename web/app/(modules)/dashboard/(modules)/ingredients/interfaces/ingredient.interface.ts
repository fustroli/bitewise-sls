import { ICreateIngredient } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';

export interface IIngredient extends ICreateIngredient {
  id: string;
  createTimeStamp: Date;
  updateTimeStamp: Date;
  deleteTimeStamp: Date | null;
}
