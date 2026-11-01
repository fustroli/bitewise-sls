import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';

/** What a picker needs to offer an Ingredient. */
export interface IIngredientOption {
  id: string;
  name: string;
  unit: EUnit;
}
