'use client';

import {
  IDraftOptions,
  IDraftRecords,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import {
  resolveWeek,
  weekSummary,
} from '@/app/(modules)/dashboard/(modules)/_week-plan/helpers';
import { useEffect, useMemo, useState } from 'react';

import DayStrip from '@/app/(modules)/dashboard/(modules)/_week-plan/components/DayStrip';
import DraftRecordsError from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftRecordsError';
import { LOCALE } from '@/app/copy';
import { TStoredWeek } from '@/app/(modules)/dashboard/(modules)/_week-plan/validations';
import WeekDay from '@/app/(modules)/dashboard/(modules)/_week-plan/components/WeekDay';
import WeekPlanSkeleton from '@/app/(modules)/dashboard/(modules)/_week-plan/components/WeekPlanSkeleton';
import WeekSummary from '@/app/(modules)/dashboard/(modules)/_week-plan/components/WeekSummary';
import { interpolate } from '@/app/utils/helpers';
import { isDraftSettled } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import { useDailyTargets } from '@/app/(modules)/dashboard/(modules)/meal-plans/hooks';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useDraftRecords } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/hooks';
import { useHydrated } from '@/app/hooks/use-hydrated';
import { useSettledValue } from '@/app/hooks/use-settled-value';
import { useWeekPlan } from '@/app/(modules)/dashboard/(modules)/_week-plan/context';

interface IProps {
  options: IDraftOptions;
  /** Where to complete the Body stats the targets need. */
  bodyStatsHref: string;
}

interface IWeekProps extends IProps {
  stored: TStoredWeek;
  records: IDraftRecords;
}

const Week = ({ stored, records, options, bodyStatsHref }: IWeekProps) => {
  const labels = useDictionary().weekPlan;
  const lang = LOCALE;
  const { names, shortNames, today, selectedDay, selectDay, replaceWeek } =
    useWeekPlan();
  const targets = useDailyTargets();
  const { sources } = records;

  const resolved = useMemo(
    () => resolveWeek(stored, sources),
    [stored, sources],
  );
  // Counted once, as the week is first shown (its items all fetched).
  const [removed] = useState(resolved.removed);

  // Stores the week without its missing items, so they're dropped for good.
  useEffect(() => {
    if (resolved.removed) replaceWeek(resolved.week);
  }, [resolved, replaceWeek]);

  const { week } = resolved;
  const latest = useMemo(
    () => weekSummary(week, sources, targets?.calories),
    [week, sources, targets?.calories],
  );
  // While a new pick or load fetches, the totals stay as they were.
  const summary =
    useSettledValue(latest, isDraftSettled(week.days.flat(), sources)) ??
    latest;

  return (
    <>
      {removed > 0 && (
        <p role="status" className="text-sm text-muted-foreground">
          {interpolate(labels.removed, { count: removed })}
        </p>
      )}
      <WeekSummary summary={summary} targets={targets} lang={lang} />
      <div className="flex flex-col gap-4 md:gap-6">
        <DayStrip
          summary={summary}
          targetKcal={targets?.calories}
          names={names}
          shortNames={shortNames}
          today={today}
          selectedDay={selectedDay}
          onSelect={selectDay}
          lang={lang}
        />
        <WeekDay
          day={selectedDay}
          name={names[selectedDay]}
          isToday={selectedDay === today}
          lines={week.days[selectedDay]}
          total={summary.totals[selectedDay]}
          options={options}
          sources={sources}
          bodyStatsHref={bodyStatsHref}
          lang={lang}
        />
      </div>
    </>
  );
};

/**
 * The User's Week plan: the week's summary, the seven days, and the selected
 * one's editor. Opens on today; an empty week shows as is.
 */
const WeekPlan = (props: IProps) => {
  const { week } = useWeekPlan();
  const records = useDraftRecords();
  const { sources, request, hasFailed, retry } = records;

  // Every line's item is fetched by id: the stored ones, and each new pick.
  useEffect(() => {
    if (week) request(week.days.flat());
  }, [week, request]);

  // Shown once the stored week's items are in, so what's gone is dropped
  // and counted before the days render.
  const [isReady, setIsReady] = useState(false);
  if (week && !isReady && isDraftSettled(week.days.flat(), sources))
    setIsReady(true);

  // This boundary can hydrate after the provider has read the store: until
  // it has, it shows what the server rendered.
  const isHydrated = useHydrated();

  if (!week || !isHydrated) return <WeekPlanSkeleton />;

  if (!isReady)
    return hasFailed ? (
      <DraftRecordsError onRetry={retry} />
    ) : (
      <WeekPlanSkeleton />
    );

  return <Week stored={week} records={records} {...props} />;
};

export default WeekPlan;
