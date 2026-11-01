'use client';

import { Control, useWatch } from 'react-hook-form';

import { Button } from '@/app/components/ui/button';
import ComboboxField from '@/app/components/form/ComboboxField';
import { Delete } from 'lucide-react';
import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import { IIngredientOption } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { IOption } from '@/app/utils/interfaces';
import InputField from '@/app/components/form/InputField';
import { TMealSchema } from '@/app/(modules)/dashboard/(modules)/meals/validations';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  index: number;
  options: IOption[];
  ingredients: IIngredientOption[];
  control: Control<TMealSchema>;
  onRemove: () => void;
}

const MealIngredient = ({
  index,
  options,
  ingredients,
  control,
  onRemove,
}: IProps) => {
  const {
    resourceTable,
    resources: {
      meals: { fields },
    },
  } = useDictionary();

  const ingredientId = useWatch({
    control,
    name: `mealIngredients.${index}.ingredientId`,
  });
  const unit = ingredients.find(({ id }) => id === ingredientId)?.unit;

  return (
    <div className="flex items-start gap-4">
      <ComboboxField
        control={control}
        name={`mealIngredients.${index}.ingredientId`}
        label={fields.ingredient}
        options={options}
        placeholder={fields.ingredientPlaceholder}
        searchPlaceholder={resourceTable.search}
        emptyText={resourceTable.notFound}
      />

      <InputField
        control={control}
        label={fields.quantity}
        name={`mealIngredients.${index}.quantity`}
        type="number"
        endAdornment={
          unit && (
            <span className="pr-3 text-sm text-muted-foreground">
              {unit === EUnit.PIECE ? fields.pieces : fields.grams}
            </span>
          )
        }
      />

      {/* Offset by the fields' label and its gap, so it lines up with their controls. */}
      <Button
        type="button"
        aria-label={fields.removeIngredient}
        variant="destructive"
        className="mt-[1.375rem]"
        onClick={() => onRemove()}
      >
        <Delete />
      </Button>
    </div>
  );
};

export default MealIngredient;
