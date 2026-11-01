'use client';

import {
  IComparisonOption,
  SLOT_DOT_CLASSES,
} from '@/app/(modules)/dashboard/compare/components/compare.types';

import Combobox from '@/app/components/form/Combobox';
import { cn } from '@/app/lib';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useMemo } from 'react';

interface IProps {
  items: IComparisonOption[];
  ids: (string | null)[];
  onPick: (slot: number, id: string | null) => void;
}

/** One labelled picker per slot; the first (the baseline) can't be emptied. */
const SlotPickers = ({ items, ids, onPick }: IProps) => {
  const { comparison: labels, resourceTable } = useDictionary();
  const options = useMemo(
    () =>
      [...items]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({ value: item.id, label: item.name })),
    [items],
  );

  return (
    <div className="grid overflow-hidden rounded-lg border bg-card md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] md:gap-4 md:overflow-visible md:border-0 md:bg-transparent">
      {ids.map((id, slot) => {
        const selectId = `compare-slot-${slot}`;
        const isBaseline = slot === 0;
        const isKnown = items.some((item) => item.id === id);

        return (
          <div
            key={slot}
            className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 md:flex-col md:items-stretch md:gap-2 md:rounded-lg md:border md:bg-card md:p-4 md:first:border-t"
          >
            <label
              htmlFor={selectId}
              className="flex w-24 shrink-0 items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-secondary-foreground md:w-auto"
            >
              <span
                aria-hidden
                className={cn('size-2.5 rounded-full', SLOT_DOT_CLASSES[slot])}
              />
              {isBaseline
                ? labels.baseline
                : interpolate(labels.item, { n: slot + 1 })}
            </label>
            <Combobox
              id={selectId}
              value={isKnown ? id : null}
              onChange={(value) => onPick(slot, value)}
              options={options}
              placeholder={labels.placeholder}
              searchPlaceholder={resourceTable.search}
              emptyText={resourceTable.notFound}
              noneLabel={isBaseline ? undefined : labels.none}
              className="w-auto min-w-0 flex-1 text-[15px] font-bold"
            />
          </div>
        );
      })}
    </div>
  );
};

export default SlotPickers;
