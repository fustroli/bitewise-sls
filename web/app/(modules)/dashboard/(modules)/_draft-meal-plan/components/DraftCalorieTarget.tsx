'use client';

import {
  calorieTargetName,
  formatCalories,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';

import BelowSafeMinimum from '@/app/(modules)/dashboard/(modules)/_body-metrics/components/BelowSafeMinimum';
import { Button } from '@/app/components/ui/button';
import { LOCALE } from '@/app/copy';
import Link from 'next/link';
import { cn } from '@/app/lib';
import { formatCalorieDelta } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import { interpolate } from '@/app/utils/helpers';
import { useDailyTargets } from '@/app/(modules)/dashboard/(modules)/meal-plans/hooks';
import { useDictionary } from '@/app/providers/dictionary-provider';

/** Colours the delta by where it rounds to: over, at or under the target. */
const DELTA_CLASSES: Record<string, string> = {
  '1': 'text-warning',
  '0': 'text-primary',
  '-1': 'text-primary',
};

// `Math.sign(-0)` is `-0`, which `String()` still makes `'0'`.
const deltaClass = (delta: number) =>
  DELTA_CLASSES[String(Math.sign(Math.round(delta)))];

interface IProps {
  /** The draft's total, full precision. */
  kcal: number;
  profileHref: string;
}

/** The draft's calories against the User's picked Calorie target. */
const DraftCalorieTarget = ({ kcal, profileHref }: IProps) => {
  const { draftMealPlan, dashboard } = useDictionary();
  const labels = draftMealPlan.maintenance;
  const lang = LOCALE;
  const targets = useDailyTargets();

  if (!targets) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">{labels.missing}</p>
        <Button asChild variant="outline">
          <Link href={profileHref}>{labels.completeProfile}</Link>
        </Button>
      </div>
    );
  }

  const delta = kcal - targets.calories;

  return (
    <div className="flex flex-col gap-1 rounded-md bg-surface-subtle p-4">
      <p
        className={cn(
          'text-2xl font-extrabold tracking-tight',
          deltaClass(delta),
        )}
      >
        {formatCalorieDelta(delta, lang)}{' '}
        <span className="text-base font-medium text-muted-foreground">
          {labels.kcal}
        </span>
      </p>
      <p className="text-sm text-muted-foreground">
        {targets.target.kgPerWeek === 0
          ? interpolate(labels.comparedWith, {
              maintenance: formatCalories(targets.calories, lang),
            })
          : interpolate(labels.comparedWithTarget, {
              target: calorieTargetName(
                targets.target,
                dashboard.bodyMetrics.calories.targetNames,
                lang,
              ),
              kcal: formatCalories(targets.calories, lang),
            })}
      </p>
      {targets.target.belowSafeMinimum && (
        <BelowSafeMinimum
          safeMinimum={targets.safeMinimum}
          locale={lang}
          className="mt-1"
        />
      )}
    </div>
  );
};

export default DraftCalorieTarget;
