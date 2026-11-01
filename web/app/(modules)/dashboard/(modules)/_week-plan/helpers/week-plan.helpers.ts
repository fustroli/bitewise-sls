import {
  A_MONDAY,
  DAYS_PER_WEEK,
  DAY_MS,
  WEEK_PLAN_STORAGE_VERSION,
} from '@/app/(modules)/dashboard/(modules)/_week-plan/constants';
import {
  IResolvedWeek,
  IWeekSummary,
} from '@/app/(modules)/dashboard/(modules)/_week-plan/interfaces';
import {
  TStoredWeek,
  storedWeekSchema,
} from '@/app/(modules)/dashboard/(modules)/_week-plan/validations';
import {
  draftNutrition,
  mealPlanDraft,
  resolveDraftLines,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import {
  scaleNutrition,
  sumNutrition,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/helpers';

import { IDraftSources } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import { TDraftLine } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { calorieGap } from '@/app/(modules)/dashboard/(modules)/meal-plans/helpers';

/** Per User, since localStorage is shared by everyone using the browser. */
export const weekPlanStorageKey = (userId: string) =>
  `bitewise:week-plan:v${WEEK_PLAN_STORAGE_VERSION}:${userId}`;

export const EMPTY_WEEK: TStoredWeek = {
  version: WEEK_PLAN_STORAGE_VERSION,
  days: Array.from({ length: DAYS_PER_WEEK }, () => []),
};

/** The stored week; the empty week when unset, unreadable or another version. */
export const parseWeek = (raw: string | null): TStoredWeek => {
  if (raw === null) return EMPTY_WEEK;
  try {
    const result = storedWeekSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : EMPTY_WEEK;
  } catch {
    return EMPTY_WEEK;
  }
};

export const serializeWeek = (week: TStoredWeek) => JSON.stringify(week);

export const isDayPlanned = (lines: TDraftLine[]) => lines.length > 0;

/** Replaces each of `days` with its own copy of `lines`. */
export const setDays = (
  week: TStoredWeek,
  days: number[],
  lines: TDraftLine[],
): TStoredWeek => ({
  ...week,
  days: week.days.map((current, day) =>
    days.includes(day) ? lines.map((line) => ({ ...line })) : current,
  ),
});

/** One serving of each of a Meal plan's Meals on each of `days`. */
export const loadMealPlan = (
  week: TStoredWeek,
  mealIds: string[],
  days: number[],
) => setDays(week, days, mealPlanDraft(mealIds).lines);

/** A copy of day `from` on each of `to`; `from` itself stays as it is. */
export const copyDay = (week: TStoredWeek, from: number, to: number[]) =>
  setDays(
    week,
    to.filter((day) => day !== from),
    week.days[from],
  );

export const clearDay = (week: TStoredWeek, day: number) =>
  setDays(week, [day], []);

/** Which of `days` have lines an action on them would replace, in order. */
export const plannedDaysAmong = (week: TStoredWeek, days: number[]) =>
  [...days].sort((a, b) => a - b).filter((day) => isDayPlanned(week.days[day]));

/** Drops, on every day, lines whose Meal or Ingredient no longer exists. */
export const resolveWeek = (
  week: TStoredWeek,
  sources: IDraftSources,
): IResolvedWeek => {
  const resolved = week.days.map((lines) => resolveDraftLines(lines, sources));
  return {
    week: { ...week, days: resolved.map(({ lines }) => lines) },
    removed: resolved.reduce((sum, { removed }) => sum + removed, 0),
  };
};

/**
 * Each day's Nutrition, the daily average over planned days only, and with a
 * Calorie target how many days are on it (an empty day never is).
 */
export const weekSummary = (
  week: TStoredWeek,
  sources: IDraftSources,
  targetKcal?: number,
): IWeekSummary => {
  const totals = week.days.map((lines) => draftNutrition(lines, sources));
  const planned = week.days.map(isDayPlanned);
  const plannedTotals = totals.filter((_, day) => planned[day]);
  const plannedCount = plannedTotals.length;
  const onTarget =
    targetKcal === undefined
      ? undefined
      : totals.map(
          (total, day) =>
            planned[day] && calorieGap(total.calories, targetKcal).onTarget,
        );

  return {
    totals,
    planned,
    plannedCount,
    average: plannedCount
      ? scaleNutrition(sumNutrition(plannedTotals), 1 / plannedCount)
      : undefined,
    onTarget,
    onTargetCount: onTarget?.filter(Boolean).length,
  };
};

/** Today's weekday, Monday being 0. */
export const weekdayIndex = (date: Date) => (date.getDay() + 6) % DAYS_PER_WEEK;

/** Monday to Sunday in the User's language, e.g. `Monday` or `Mon`. */
export const weekdayNames = (locale: string, width: 'long' | 'short') => {
  const format = new Intl.DateTimeFormat(locale, {
    weekday: width,
    timeZone: 'UTC',
  });
  return Array.from({ length: DAYS_PER_WEEK }, (_, day) =>
    format.format(A_MONDAY + day * DAY_MS),
  );
};
