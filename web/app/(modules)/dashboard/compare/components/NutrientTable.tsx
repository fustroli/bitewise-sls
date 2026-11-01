'use client';

import {
  COMPARISON_DECIMALS,
  COMPARISON_NUTRIENTS,
  IComparisonNutrient,
} from '@/app/(modules)/dashboard/(modules)/_comparison/constants';
import {
  IChosenItem,
  SLOT_DOT_CLASSES,
} from '@/app/(modules)/dashboard/compare/components/compare.types';
import {
  formatAmount,
  interpolate,
  progressPercent,
} from '@/app/utils/helpers';
import { useId, useState } from 'react';

import Section from '@/app/components/layout/Section';
import { cn } from '@/app/lib';
import { formatDelta } from '@/app/(modules)/dashboard/(modules)/_comparison/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  chosen: IChosenItem[];
  lang: string;
}

/**
 * Each nutrient for each item, with a bar scaled to the row's largest value
 * and, optionally, the difference from the baseline.
 */
const NutrientTable = ({ chosen, lang }: IProps) => {
  const labels = useDictionary().comparison.nutrients;
  const [showDeltas, setShowDeltas] = useState(true);
  const checkboxId = useId();
  const baseline = chosen[0].item;

  const cell = (row: IComparisonNutrient, slotIndex: number) => {
    const { item } = chosen[slotIndex];
    const value = item[row.nutrient];
    const max = Math.max(...chosen.map((c) => c.item[row.nutrient]));
    const decimals = COMPARISON_DECIMALS[row.unit];

    return {
      text: `${formatAmount(value, lang, decimals)} ${row.unit}`,
      delta:
        showDeltas && slotIndex > 0
          ? formatDelta(
              value - baseline[row.nutrient],
              row.unit,
              decimals,
              lang,
              labels.same,
            )
          : undefined,
      width: `${progressPercent(value, max)}%`,
    };
  };

  const bar = (row: IComparisonNutrient, width: string, className?: string) => (
    <span
      aria-hidden
      className={cn(
        'block h-1.5 overflow-hidden rounded-full bg-muted',
        className,
      )}
    >
      <span
        className={cn('block h-full rounded-full', row.barClassName)}
        style={{ width }}
      />
    </span>
  );

  return (
    <Section
      id="nutrients"
      title={labels.title}
      description={interpolate(labels.description, { name: baseline.name })}
      actions={
        <div className="flex min-h-11 items-center gap-2.5">
          <input
            id={checkboxId}
            type="checkbox"
            checked={showDeltas}
            onChange={(event) => setShowDeltas(event.target.checked)}
            className="size-[18px] accent-primary"
          />
          <label
            htmlFor={checkboxId}
            className="cursor-pointer text-sm font-bold text-secondary-foreground"
          >
            {labels.showDifferences}
          </label>
        </div>
      }
    >
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed">
            <colgroup>
              <col className="w-[180px]" />
              {chosen.map(({ slot }) => (
                <col key={slot} />
              ))}
            </colgroup>
            <thead className="bg-surface-subtle">
              <tr>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-secondary-foreground"
                >
                  {labels.nutrient}
                </th>
                {chosen.map(({ slot, item }) => (
                  <th
                    key={slot}
                    scope="col"
                    className="px-5 py-3.5 text-left text-[13px] font-extrabold"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden
                        className={cn(
                          'size-2.5 shrink-0 rounded-full',
                          SLOT_DOT_CLASSES[slot],
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_NUTRIENTS.map((row) => (
                <tr
                  key={row.nutrient}
                  className={cn('border-t', row.sub && 'bg-surface-subtle/60')}
                >
                  <th
                    scope="row"
                    className={cn(
                      'px-5 py-3 text-left',
                      row.sub
                        ? 'pl-9 text-[13px] font-semibold text-muted-foreground'
                        : 'text-sm font-extrabold',
                    )}
                  >
                    {labels.rows[row.nutrient]}
                  </th>
                  {chosen.map(({ slot }, index) => {
                    const { text, delta, width } = cell(row, index);

                    return (
                      <td key={slot} className="px-5 py-3 align-top">
                        <span className="flex flex-col gap-1.5">
                          <span className="flex items-baseline justify-between gap-2">
                            <span
                              className={
                                row.sub
                                  ? 'text-sm font-semibold'
                                  : 'text-[15px] font-extrabold'
                              }
                            >
                              {text}
                            </span>
                            {delta && (
                              <span className="text-xs font-bold text-muted-foreground">
                                {delta}
                              </span>
                            )}
                          </span>
                          {bar(row, width)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <dl className="flex flex-col divide-y overflow-hidden rounded-lg border bg-card md:hidden">
        {COMPARISON_NUTRIENTS.map((row) => (
          <div key={row.nutrient} className="flex flex-col gap-2 px-4 py-3">
            <dt
              className={cn(
                row.sub
                  ? 'pl-3 text-[13px] font-semibold text-muted-foreground'
                  : 'text-sm font-extrabold',
              )}
            >
              {labels.rows[row.nutrient]}
            </dt>
            {chosen.map(({ slot, item }, index) => {
              const { text, delta, width } = cell(row, index);

              return (
                <dd key={slot} className="flex items-center gap-2.5 text-sm">
                  <span
                    aria-hidden
                    className={cn(
                      'size-2.5 shrink-0 rounded-full',
                      SLOT_DOT_CLASSES[slot],
                    )}
                  />
                  <span className="sr-only">{item.name}</span>
                  {bar(row, width, 'flex-1')}
                  <span className="w-[72px] text-right font-bold">{text}</span>
                  {showDeltas && (
                    <span className="w-[68px] text-right text-xs font-bold text-muted-foreground">
                      {delta}
                    </span>
                  )}
                </dd>
              );
            })}
          </div>
        ))}
      </dl>
    </Section>
  );
};

export default NutrientTable;
