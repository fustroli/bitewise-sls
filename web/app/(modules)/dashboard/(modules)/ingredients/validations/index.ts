import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import { INGREDIENT_NUMBER_FIELDS } from '@/app/(modules)/dashboard/(modules)/ingredients/constants';
import { TDictionary } from '@/app/providers/dictionary-provider';
import { interpolate } from '@/app/utils/helpers';
import { z } from 'zod';

type TNumberField = (typeof INGREDIENT_NUMBER_FIELDS)[number];

export const createIngredientSchema = ({
  resourceTable,
  resources: { ingredients },
}: TDictionary) => {
  const positiveNumber = (field: TNumberField) => {
    const message = interpolate(resourceTable.positiveNumber, {
      field: ingredients.fields[field],
    });

    return z.number({ error: message }).min(0, { message });
  };

  return z.object({
    name: z.string().min(1, { message: ingredients.validation.nameRequired }),
    protein: positiveNumber('protein'),
    totalFat: positiveNumber('totalFat'),
    saturatedFat: positiveNumber('saturatedFat'),
    totalCarbohydrates: positiveNumber('totalCarbohydrates'),
    sugar: positiveNumber('sugar'),
    dietaryFiber: positiveNumber('dietaryFiber'),
    calories: positiveNumber('calories'),
    unit: z.nativeEnum(EUnit),
  });
};

export type TIngredientSchema = z.infer<
  ReturnType<typeof createIngredientSchema>
>;
