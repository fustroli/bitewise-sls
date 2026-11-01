import {
  EMPTY_WEEK,
  clearDay,
  copyDay,
  loadMealPlan,
  parseWeek,
  plannedDaysAmong,
  resolveWeek,
  serializeWeek,
  weekPlanStorageKey,
  weekSummary,
  weekdayIndex,
  weekdayNames,
} from '@/app/(modules)/dashboard/(modules)/_week-plan/helpers';
import { describe, expect, it } from 'vitest';

import { EDraftLineKind } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/enums';
import { EMPTY_NUTRITION } from '@/app/(modules)/dashboard/(modules)/_nutrition/constants';
import { EUnit } from '@/app/(modules)/dashboard/(modules)/ingredients/enums';
import { IDraftSources } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import { IIngredient } from '@/app/(modules)/dashboard/(modules)/ingredients/interfaces';
import { IMeal } from '@/app/(modules)/dashboard/(modules)/meals/interfaces';
import { TDraftLine } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { TStoredWeek } from '@/app/(modules)/dashboard/(modules)/_week-plan/validations';

/** A ULID for a small test number, so cases read as numbers. */
const id = (n: number) =>
  `01JAZ3Q8V6X2M5N7P9R1S3T${String(n).padStart(3, '0')}`;

// One piece is 1,000 kcal, so a day's calories read as its count.
const BAR: IIngredient = {
  ...EMPTY_NUTRITION,
  id: id(1),
  name: 'Bar',
  unit: EUnit.PIECE,
  calories: 1000,
  protein: 10,
  createTimeStamp: new Date(0),
  updateTimeStamp: new Date(0),
  deleteTimeStamp: null,
};

// Two bars: 2,000 kcal.
const MEAL: IMeal = {
  id: id(10),
  name: 'Two bars',
  mealIngredients: [
    {
      ...BAR,
      ingredientId: BAR.id,
      ingredientName: BAR.name,
      quantity: 2,
    },
  ],
};

const SOURCES: IDraftSources = {
  meals: [MEAL],
  ingredients: [BAR],
  missing: { meals: [id(99), id(97)], ingredients: [id(98)] },
};

/** Item `0` is an unpicked line. */
const meal = (item: number, quantity = 1): TDraftLine => ({
  kind: EDraftLineKind.MEAL,
  itemId: item ? id(item) : '',
  quantity,
});

const bars = (quantity: number, item = 1): TDraftLine => ({
  kind: EDraftLineKind.INGREDIENT,
  itemId: id(item),
  quantity,
});

const week = (days: Record<number, TDraftLine[]>): TStoredWeek => ({
  ...EMPTY_WEEK,
  days: EMPTY_WEEK.days.map((lines, day) => days[day] ?? lines),
});

describe('weekPlanStorageKey', () => {
  it('is per User and versioned', () => {
    expect(weekPlanStorageKey('user-sub')).toBe(
      'bitewise:week-plan:v2:user-sub',
    );
  });
});

describe('parseWeek', () => {
  it('reads back a serialized week', () => {
    const stored = week({ 0: [meal(10, 1.5)], 6: [bars(0.5)] });

    expect(parseWeek(serializeWeek(stored))).toEqual(stored);
  });

  it('is the empty week without one', () => {
    expect(parseWeek(null)).toEqual(EMPTY_WEEK);
  });

  it.each([
    ['not JSON', '{oops'],
    ['another version', JSON.stringify({ ...EMPTY_WEEK, version: 1 })],
    [
      'six days',
      JSON.stringify({ ...EMPTY_WEEK, days: [[], [], [], [], [], []] }),
    ],
    [
      'eight days',
      JSON.stringify({ ...EMPTY_WEEK, days: [...EMPTY_WEEK.days, []] }),
    ],
    [
      'a wrong line',
      JSON.stringify(week({ 2: [{ kind: 'pizza' } as unknown as TDraftLine] })),
    ],
  ])('discards %s', (_, raw) => {
    expect(parseWeek(raw)).toEqual(EMPTY_WEEK);
  });
});

describe('loadMealPlan', () => {
  it('replaces each chosen day with one serving of each Meal', () => {
    const before = week({ 0: [bars(3)], 1: [bars(1)] });

    expect(loadMealPlan(before, [id(10), id(11)], [0, 4])).toEqual(
      week({ 0: [meal(10), meal(11)], 1: [bars(1)], 4: [meal(10), meal(11)] }),
    );
  });

  it('gives each day its own lines', () => {
    const after = loadMealPlan(EMPTY_WEEK, [id(10)], [0, 1]);

    expect(after.days[0][0]).not.toBe(after.days[1][0]);
  });
});

describe('copyDay', () => {
  it('replaces the chosen days with a copy of the day', () => {
    const before = week({ 0: [meal(10, 2)], 3: [bars(1)] });

    expect(copyDay(before, 0, [3, 5])).toEqual(
      week({ 0: [meal(10, 2)], 3: [meal(10, 2)], 5: [meal(10, 2)] }),
    );
  });

  it('leaves the day itself alone', () => {
    const before = week({ 2: [bars(1)] });

    expect(copyDay(before, 2, [2])).toEqual(before);
  });
});

describe('clearDay', () => {
  it('empties that day only', () => {
    expect(clearDay(week({ 0: [bars(1)], 1: [bars(2)] }), 0)).toEqual(
      week({ 1: [bars(2)] }),
    );
  });
});

describe('plannedDaysAmong', () => {
  it('lists the chosen days that have lines, Monday first', () => {
    expect(
      plannedDaysAmong(week({ 1: [bars(1)], 4: [bars(1)] }), [4, 2, 1]),
    ).toEqual([1, 4]);
  });
});

describe('resolveWeek', () => {
  it('drops missing Meals and Ingredients on every day and counts them', () => {
    const { week: resolved, removed } = resolveWeek(
      week({
        0: [meal(10), meal(99)],
        3: [bars(1), bars(1, 98)],
        6: [meal(97)],
      }),
      SOURCES,
    );

    expect(resolved).toEqual(week({ 0: [meal(10)], 3: [bars(1)], 6: [] }));
    expect(removed).toBe(3);
  });

  it('keeps unpicked lines and lines still loading', () => {
    expect(
      resolveWeek(week({ 0: [meal(0)], 1: [meal(50)] }), SOURCES).removed,
    ).toBe(0);
  });
});

describe('weekSummary', () => {
  // Mon 2,000 · Tue 2,100 · Wed 3,000 · rest empty.
  const planned = week({ 0: [meal(10)], 1: [bars(2.1)], 2: [bars(3)] });

  it('averages over planned days only', () => {
    const { average, plannedCount } = weekSummary(planned, SOURCES);

    expect(plannedCount).toBe(3);
    expect(average?.calories).toBeCloseTo(7100 / 3);
    expect(average?.protein).toBeCloseTo(71 / 3);
  });

  it('has no average without planned days', () => {
    expect(weekSummary(EMPTY_WEEK, SOURCES).average).toBeUndefined();
  });

  it('counts days within 150 kcal of the target; empty days are off', () => {
    const { onTarget, onTargetCount } = weekSummary(planned, SOURCES, 2000);

    expect(onTarget).toEqual([true, true, false, false, false, false, false]);
    expect(onTargetCount).toBe(2);
  });

  it('counts an empty day as off target even at a target of 0', () => {
    expect(weekSummary(EMPTY_WEEK, SOURCES, 0).onTargetCount).toBe(0);
  });

  it('leaves on target out without a target', () => {
    expect(weekSummary(planned, SOURCES).onTargetCount).toBeUndefined();
  });
});

describe('weekdayIndex', () => {
  it('starts the week on Monday', () => {
    expect(weekdayIndex(new Date(2026, 9, 12))).toBe(0); // a Monday
    expect(weekdayIndex(new Date(2026, 9, 18))).toBe(6); // a Sunday
  });
});

describe('weekdayNames', () => {
  it('names Monday to Sunday in the locale', () => {
    expect(weekdayNames('en', 'long')).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
    expect(weekdayNames('de', 'short')[0]).toBe('Mo');
  });
});
