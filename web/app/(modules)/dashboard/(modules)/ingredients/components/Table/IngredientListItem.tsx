'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';
import { ReactNode, useState } from 'react';
import { formatAmount, interpolate } from '@/app/utils/helpers';

import { Button } from '@/app/components/ui/button';
import { IIngredient } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import Link from 'next/link';
import SubtleStat from '@/app/components/display/SubtleStat';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  row: IIngredient;
  lang: string;
  /** The Edit dialog behind a button. */
  edit: ReactNode;
  compareHref: string;
}

/** One Ingredient below `md`: tap for sugar, fat and fiber, Edit, Compare. */
const IngredientListItem = ({ row, lang, edit, compareHref }: IProps) => {
  const { resources, resourceTable } = useDictionary();
  const labels = resources.ingredients;
  const [open, setOpen] = useState(false);
  const amount = (value: number) => formatAmount(value, lang);

  return (
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          aria-label={interpolate(labels.list.details, { name: row.name })}
          className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[15px] font-extrabold">{row.name}</span>
            <span className="flex flex-wrap gap-x-2.5 text-xs font-bold text-secondary-foreground">
              <span>{labels.units[row.unit]}</span>
              <span className="text-protein">P {amount(row.protein)}</span>
              <span className="text-carbs-text">
                C {amount(row.totalCarbohydrates)}
              </span>
              <span className="text-fat">F {amount(row.totalFat)}</span>
            </span>
          </span>
          <span className="flex flex-col items-end">
            <span className="text-base font-extrabold">
              {amount(row.calories)}
            </span>
            <span className="text-[11px] text-muted-foreground">kcal</span>
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-2.5 px-4 pb-3.5">
          <div className="grid grid-cols-3 gap-2">
            <SubtleStat
              label={labels.list.sugarLabel}
              value={`${amount(row.sugar)} g`}
            />
            <SubtleStat
              label={labels.list.saturatedLabel}
              value={`${amount(row.saturatedFat)} g`}
            />
            <SubtleStat
              label={labels.list.fiberLabel}
              value={`${amount(row.dietaryFiber)} g`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 [&>*]:w-full">
            {edit}
            <Button asChild variant="outline">
              <Link href={compareHref}>{resourceTable.compare}</Link>
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};

export default IngredientListItem;
