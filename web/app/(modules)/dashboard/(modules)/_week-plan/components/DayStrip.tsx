'use client';

import { formatAmount, interpolate } from '@/app/utils/helpers';

import { IWeekSummary } from '@/app/(modules)/dashboard/(modules)/_week-plan/interfaces';
import { calorieGap } from '@/app/(modules)/dashboard/(modules)/meal-plans/helpers';
import { cn } from '@/app/lib';
import { formatCalorieDelta } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';

type TDayStatus = 'empty' | 'planned' | 'on' | 'off';

const DOT_CLASSES: Record<TDayStatus, string> = {
  empty: 'bg-border',
  planned: 'bg-foreground',
  on: 'bg-primary',
  off: 'rounded-sm bg-warning',
};

const STATUS_TEXT_CLASSES: Record<TDayStatus, string> = {
  empty: 'text-muted-foreground',
  planned: 'text-muted-foreground',
  on: 'text-primary',
  off: 'text-warning',
};

interface IProps {
  summary: IWeekSummary;
  /** The Calorie target in kcal; unset while it can't be computed. */
  targetKcal?: number;
  /** Monday to Sunday. */
  names: string[];
  shortNames: string[];
  today: number;
  selectedDay: number;
  onSelect: (day: number) => void;
  lang: string;
}

/**
 * The seven days side by side, each with its calories and how it stands
 * against the target; picking one opens it below. Today is outlined.
 */
const DayStrip = ({
  summary,
  targetKcal,
  names,
  shortNames,
  today,
  selectedDay,
  onSelect,
  lang,
}: IProps) => {
  const labels = useDictionary().weekPlan.days;

  const status = (day: number): TDayStatus => {
    if (!summary.planned[day]) return 'empty';
    if (!summary.onTarget) return 'planned';
    return summary.onTarget[day] ? 'on' : 'off';
  };

  // Only called for an off-target day, which has a target.
  const delta = (day: number) =>
    formatCalorieDelta(
      calorieGap(summary.totals[day].calories, targetKcal ?? 0).diff,
      lang,
    );

  /** Next to the dot; a planned day without a target shows only its calories. */
  const statusText = (day: number) =>
    ({
      empty: labels.empty,
      on: labels.onTarget,
      off: delta(day),
      planned: undefined,
    })[status(day)];

  const ariaLabel = (day: number) => {
    const state = status(day);
    const parts = [names[day]];
    if (day === today) parts.push(labels.today);
    if (summary.planned[day]) {
      parts.push(`${formatAmount(summary.totals[day].calories, lang, 0)} kcal`);
    }
    if (state === 'off') {
      parts.push(interpolate(labels.offTarget, { value: delta(day) }));
    } else if (state !== 'planned') {
      parts.push(labels[state === 'on' ? 'onTarget' : 'empty']);
    }
    return parts.join(', ');
  };

  return (
    <ul aria-label={labels.label} className="grid grid-cols-7 gap-1 md:gap-2">
      {names.map((name, day) => {
        const isSelected = day === selectedDay;
        const isToday = day === today;
        const state = status(day);

        return (
          <li key={name} className="min-w-0">
            <button
              type="button"
              aria-pressed={isSelected}
              aria-label={ariaLabel(day)}
              onClick={() => onSelect(day)}
              className={cn(
                'flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-md border bg-card px-1 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-[104px] md:items-stretch md:justify-start md:p-3',
                isSelected
                  ? 'border-2 border-primary bg-accent'
                  : 'hover:border-muted-foreground',
                !isSelected && isToday && 'border-foreground',
              )}
            >
              <span className="flex min-w-0 flex-wrap items-center justify-between gap-1">
                <span
                  className={cn(
                    'truncate text-xs font-extrabold md:text-sm',
                    isToday && 'underline underline-offset-4 md:no-underline',
                  )}
                >
                  {shortNames[day]}
                </span>
                {isToday && (
                  <span className="hidden shrink-0 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-background md:inline">
                    {labels.today}
                  </span>
                )}
              </span>
              <span className="hidden text-lg font-extrabold tracking-tight md:block">
                {summary.planned[day]
                  ? formatAmount(summary.totals[day].calories, lang, 0)
                  : '—'}
              </span>
              <span
                className={cn(
                  'flex items-center gap-1.5 text-xs font-bold',
                  STATUS_TEXT_CLASSES[state],
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    DOT_CLASSES[state],
                  )}
                />
                <span className="hidden truncate lg:inline">
                  {statusText(day)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default DayStrip;
