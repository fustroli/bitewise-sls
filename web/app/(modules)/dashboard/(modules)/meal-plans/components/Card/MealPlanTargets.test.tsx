// @vitest-environment jsdom

import {
  EActivityLevel,
  ECalorieTarget,
  EMacroPlan,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { EMPTY_NUTRITION } from '@/app/(modules)/dashboard/(modules)/_nutrition/constants';
import { IUser } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { ME_KEY } from '@/app/(modules)/dashboard/(modules)/_user/queries';
import MealPlanTargets from '@/app/(modules)/dashboard/(modules)/meal-plans/components/Card/MealPlanTargets';
import { TestQueryProvider } from '@/app/utils/testing/test-query-provider';
import { UserProvider } from '@/app/(modules)/dashboard/(modules)/_user/provider';
import { bodyMetrics } from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';
import { copy as en } from '@/app/copy';

const labels = en.resources.mealPlans.card;

const USER: IUser = {
  id: '01JAZ3Q8V6X2M5N7P9R1S3T5W7',
  email: 'user@example.com',
  bodyStats: {
    sex: ESex.MALE,
    heightCm: 178,
    weightKg: 70,
    neckCm: null,
    waistCm: null,
    hipCm: null,
    activityLevel: EActivityLevel.MODERATE,
  },
  personalInformation: { dateOfBirth: '1990-01-15T12:00:00.000Z' },
};

const maintenance = bodyMetrics({
  bodyStats: USER.bodyStats!,
  dateOfBirth: USER.personalInformation!.dateOfBirth,
  today: new Date(),
}).calories!.maintenance;

const renderTargets = (user: IUser, calories: number) =>
  render(
    <>
      <TestQueryProvider seed={[[ME_KEY, user]]}>
        <UserProvider actions={{ updateUser: vi.fn() }}>
          <MealPlanTargets
            total={{ ...EMPTY_NUTRITION, calories, protein: 100 }}
            lang="en"
            bodyStatsHref="/dashboard/profile#body-stats"
          />
        </UserProvider>
      </TestQueryProvider>
    </>,
  );

describe('MealPlanTargets', () => {
  afterEach(cleanup);

  it('is on target within 150 kcal of Maintenance by default', () => {
    renderTargets(USER, maintenance + 100);

    expect(screen.getByText('On target (+100 kcal)')).toBeTruthy();
  });

  it('says how far under Maintenance a day is', () => {
    renderTargets(USER, maintenance - 500);

    expect(screen.getByText('500 kcal under maintenance')).toBeTruthy();
  });

  it("uses the dashboard's macro split", () => {
    renderTargets(
      {
        ...USER,
        targets: { calorieTarget: null, macroPlan: EMacroPlan.LOW_CARB },
      },
      maintenance,
    );
    const lowCarb = bodyMetrics({
      bodyStats: USER.bodyStats!,
      dateOfBirth: USER.personalInformation!.dateOfBirth,
      today: new Date(),
    }).macros!.plans.find(({ plan }) => plan === EMacroPlan.LOW_CARB)!;

    expect(
      screen.getByText(`/ ${Math.round(lowCarb.protein.grams)} g`),
    ).toBeTruthy();
  });

  it('measures against the picked Calorie target', () => {
    renderTargets(
      {
        ...USER,
        targets: { calorieTarget: ECalorieTarget.LOSE_NORMAL, macroPlan: null },
      },
      maintenance - 300,
    );

    expect(
      screen.getByText('200 kcal over target (Lose 0.5 kg/wk)'),
    ).toBeTruthy();
    expect(
      screen.getByText(
        `/ ${Math.round(maintenance - 500).toLocaleString('en')} kcal`,
      ),
    ).toBeTruthy();
  });

  it('shows plain totals and asks for Body stats without targets', () => {
    renderTargets({ ...USER, bodyStats: undefined }, 1800);

    expect(screen.getByText('1,800')).toBeTruthy();
    expect(screen.getByText(labels.noTargets)).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: en.dashboard.bodyMetrics.addBodyStats })
        .getAttribute('href'),
    ).toBe('/dashboard/profile#body-stats');
  });
});
