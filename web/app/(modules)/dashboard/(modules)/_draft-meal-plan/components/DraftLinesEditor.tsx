'use client';

import DraftNutritionCells, {
  DraftNutritionHeads,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftNutritionCells';
import {
  IDraftOptions,
  IDraftSources,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import {
  TDraftLine,
  TDraftSchema,
  createDraftSchema,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  draftLineNutrition,
  draftLineState,
  draftLineUnit,
  draftNutrition,
  isDraftSettled,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/app/components/ui/button';
import { DEFAULT_MEAL_MULTIPLIER } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/constants';
import DraftLineRow from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftLineRow';
import { EDraftLineKind } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/enums';
import { Form } from '@/app/components/ui/form';
import { Plus } from 'lucide-react';
import { convertToOptions } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { zodResolver } from '@hookform/resolvers/zod';

interface IProps {
  /** Read once, when the editor mounts; from then on the editor owns the lines. */
  initial: TDraftLine[];
  /** What the pickers offer. */
  options: IDraftOptions;
  /** The picked items' records, fetched by whoever holds the lines. */
  sources: IDraftSources;
  /** Names the table for screen readers. */
  label: string;
  /** Every change, as is (incomplete lines included), and once on mount. */
  onChange: (lines: TDraftLine[]) => void;
}

/**
 * A list of Meal and Ingredient lines with their Nutrition and a total, each
 * item on one line only, plus Add meal / Add ingredient. Incomplete lines are
 * flagged but still reported.
 */
const DraftLinesEditor = ({
  initial,
  options: items,
  sources,
  label,
  onChange,
}: IProps) => {
  const dictionary = useDictionary();
  const { draftMealPlan: labels, resourceTable } = dictionary;

  const schema = useMemo(() => createDraftSchema(dictionary), [dictionary]);
  const form = useForm<TDraftSchema>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { lines: initial },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });
  const lines = useWatch({ control: form.control, name: 'lines' });

  // Flag what stored lines left incomplete.
  useEffect(() => {
    void form.trigger();
  }, [form]);

  useEffect(() => {
    onChange(lines);
  }, [lines, onChange]);

  const options = useMemo(
    () => ({
      [EDraftLineKind.MEAL]: convertToOptions(items.meals),
      [EDraftLineKind.INGREDIENT]: convertToOptions(items.ingredients),
    }),
    [items],
  );

  // An item appears on one line only: each line offers what no other line
  // of its kind picked.
  const optionsFor = (index: number, kind: EDraftLineKind) =>
    options[kind].filter(
      ({ value }) =>
        !lines.some(
          (line, other) =>
            other !== index && line.kind === kind && line.itemId === value,
        ),
    );

  return (
    <>
      {fields.length > 0 ? (
        <Form {...form}>
          <Table aria-label={label}>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.columns.item}</TableHead>
                <TableHead>{labels.columns.quantity}</TableHead>
                <DraftNutritionHeads />
                <TableHead>
                  <span className="sr-only">{resourceTable.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                // Right after an append, the watched values can be a
                // render behind the rows.
                const line = lines[index] ?? field;
                return (
                  <DraftLineRow
                    key={field.id}
                    index={index}
                    line={line}
                    control={form.control}
                    options={optionsFor(index, line.kind)}
                    unit={draftLineUnit(line, items.ingredients)}
                    nutrition={
                      draftLineState(line, sources) === 'pending'
                        ? undefined
                        : draftLineNutrition(line, sources)
                    }
                    onRemove={() => remove(index)}
                  />
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">
                  {labels.total}
                </TableCell>
                <DraftNutritionCells
                  nutrition={
                    isDraftSettled(lines, sources)
                      ? draftNutrition(lines, sources)
                      : undefined
                  }
                  isTotal
                />
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </Form>
      ) : (
        <p className="text-sm text-muted-foreground">{labels.empty}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="tinted"
          onClick={() =>
            append({
              kind: EDraftLineKind.MEAL,
              itemId: '',
              quantity: DEFAULT_MEAL_MULTIPLIER,
            })
          }
        >
          <Plus aria-hidden />
          {labels.addMeal}
        </Button>
        <Button
          type="button"
          variant="tinted"
          onClick={() =>
            append({
              kind: EDraftLineKind.INGREDIENT,
              itemId: '',
              quantity: null,
            })
          }
        >
          <Plus aria-hidden />
          {labels.addIngredient}
        </Button>
      </div>
    </>
  );
};

export default DraftLinesEditor;
