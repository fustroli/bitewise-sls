'use client';

import {
  TDraftLine,
  TDraftSchema,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { TableCell, TableRow } from '@/app/components/ui/table';

import { Button } from '@/app/components/ui/button';
import ComboboxField from '@/app/components/form/ComboboxField';
import { Control } from 'react-hook-form';
import { Delete } from 'lucide-react';
import DraftNutritionCells from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftNutritionCells';
import { EDraftLineKind } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/enums';
import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import { INutrition } from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';
import { IOption } from '@/app/utils/interfaces';
import InputField from '@/app/components/form/InputField';
import { MEAL_MULTIPLIER_STEP } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/constants';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  index: number;
  line: TDraftLine;
  control: Control<TDraftSchema>;
  /** The items of the line's kind that no other line picked. */
  options: IOption[];
  /** An Ingredient line's Unit, once picked. */
  unit?: EUnit;
  /** Unset while the line's item loads. */
  nutrition?: INutrition;
  onRemove: () => void;
}

const DraftLineRow = ({
  index,
  line,
  control,
  options,
  unit,
  nutrition,
  onRemove,
}: IProps) => {
  const {
    draftMealPlan: { fields },
    resourceTable,
  } = useDictionary();

  const isMeal = line.kind === EDraftLineKind.MEAL;
  const unitLabel = isMeal
    ? fields.servings
    : unit && (unit === EUnit.PIECE ? fields.pieces : fields.grams);
  const name =
    options.find(({ value }) => value === line.itemId)?.label ??
    (isMeal ? fields.meal : fields.ingredient);

  return (
    <TableRow className="align-top">
      <TableCell className="w-80 min-w-52">
        <ComboboxField
          control={control}
          name={`lines.${index}.itemId`}
          label={isMeal ? fields.meal : fields.ingredient}
          hideLabel
          options={options}
          placeholder={
            isMeal ? fields.mealPlaceholder : fields.ingredientPlaceholder
          }
          searchPlaceholder={resourceTable.search}
          emptyText={resourceTable.notFound}
          className="w-full"
        />
      </TableCell>
      <TableCell className="w-32 min-w-32">
        <InputField
          control={control}
          name={`lines.${index}.quantity`}
          label={isMeal ? fields.multiplier : fields.amount}
          hideLabel
          type="number"
          min={isMeal ? MEAL_MULTIPLIER_STEP : 0}
          step={isMeal ? MEAL_MULTIPLIER_STEP : undefined}
          endAdornment={
            unitLabel && (
              <span className="pr-3 text-sm text-muted-foreground">
                {unitLabel}
              </span>
            )
          }
        />
      </TableCell>
      <DraftNutritionCells nutrition={nutrition} />
      <TableCell className="text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={interpolate(resourceTable.remove, { name })}
          onClick={onRemove}
        >
          <Delete />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default DraftLineRow;
