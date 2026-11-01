'use client';

import {
  IChosenItem,
  SLOT_DOT_CLASSES,
} from '@/app/(modules)/dashboard/compare/components/compare.types';
import {
  formatAmount,
  interpolate,
  macroEnergyShares,
  pluralize,
} from '@/app/utils/helpers';

import BelowSafeMinimum from '@/app/(modules)/dashboard/(modules)/_body-metrics/components/BelowSafeMinimum';
import { COMPARISON_DECIMALS } from '@/app/(modules)/dashboard/(modules)/_comparison/constants';
import Chip from '@/app/components/display/Chip';
import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import { IComparisonItem } from '@/app/(modules)/dashboard/(modules)/_comparison/interfaces';
import MacroBar from '@/app/components/nutrition/MacroBar';
import { cn } from '@/app/lib';
import { formatDelta } from '@/app/(modules)/dashboard/(modules)/_comparison/helpers';
import { useDailyTargets } from '@/app/(modules)/dashboard/(modules)/meal-plans/hooks';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  kind: EComparisonKind;
  chosen: IChosenItem[];
  lang: string;
}

/** One card per picked item; the baseline's has a dark border. */
const OverviewCards = ({ kind, chosen, lang }: IProps) => {
  const { comparison: labels, dashboard } = useDictionary();
  const macroNames = dashboard.bodyMetrics.macros.macros;
  const targets = useDailyTargets();
  const baseline = chosen[0].item;

  const basis = (item: IComparisonItem) => {
    if (kind === EComparisonKind.INGREDIENTS) {
      return labels.basis[item.unit as '100g' | 'piece'] ?? item.unit;
    }
    return pluralize(
      item.parts ?? 0,
      kind === EComparisonKind.MEALS ? labels.basis.meals : labels.basis.plans,
      lang,
    );
  };
  const percent = (share: number) =>
    share.toLocaleString(lang, { style: 'percent' });

  return (
    <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:gap-4 md:overflow-visible md:px-0 md:pb-0">
      {chosen.map(({ slot, item }) => {
        const isBaseline = slot === 0;
        const shares = macroEnergyShares({
          protein: item.protein,
          carbs: item.totalCarbohydrates,
          fat: item.totalFat,
        });

        return (
          <li
            key={slot}
            className={cn(
              'flex w-[200px] shrink-0 snap-start flex-col gap-3.5 rounded-lg bg-card p-4 md:w-auto md:p-5',
              isBaseline ? 'border-2 border-compare-1' : 'border',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="flex items-center gap-2 text-base font-extrabold md:text-[17px]">
                  <span
                    aria-hidden
                    className={cn(
                      'size-2.5 shrink-0 rounded-full md:hidden',
                      SLOT_DOT_CLASSES[slot],
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </h3>
                <span className="text-[13px] text-muted-foreground">
                  {basis(item)}
                </span>
              </div>
              <Chip
                className={cn(
                  'hidden md:inline-flex',
                  isBaseline
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-secondary-foreground',
                )}
              >
                {isBaseline
                  ? labels.baseline
                  : interpolate(labels.item, { n: slot + 1 })}
              </Chip>
            </div>
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[26px] font-extrabold leading-none tracking-tight md:text-[30px]">
                {formatAmount(item.calories, lang, COMPARISON_DECIMALS.kcal)}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                kcal
              </span>
              {!isBaseline && (
                <span className="ml-auto text-[13px] font-bold text-muted-foreground">
                  {formatDelta(
                    item.calories - baseline.calories,
                    'kcal',
                    COMPARISON_DECIMALS.kcal,
                    lang,
                    labels.nutrients.same,
                  )}
                </span>
              )}
            </p>
            <MacroBar heightClassName="h-2" shares={shares} />
            <p className="flex flex-wrap justify-between gap-x-2 text-xs font-bold text-secondary-foreground">
              <span>
                {macroNames.protein} {percent(shares.protein)}
              </span>
              <span>
                {macroNames.carbs} {percent(shares.carbs)}
              </span>
              <span>
                {macroNames.fat} {percent(shares.fat)}
              </span>
            </p>
            {kind === EComparisonKind.MEAL_PLANS && targets && (
              <div className="flex flex-col gap-1.5 border-t pt-2.5">
                <p className="text-[13px] font-bold text-secondary-foreground">
                  {interpolate(labels.ofTarget, {
                    percent: percent(item.calories / targets.calories),
                    kcal: formatAmount(targets.calories, lang, 0),
                  })}
                </p>
                {targets.target.belowSafeMinimum && (
                  <BelowSafeMinimum
                    safeMinimum={targets.safeMinimum}
                    locale={lang}
                  />
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default OverviewCards;
