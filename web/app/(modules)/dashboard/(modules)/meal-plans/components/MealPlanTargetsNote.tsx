'use client';

import { formatAmount, interpolate } from '@/app/utils/helpers';

import BelowSafeMinimum from '@/app/(modules)/dashboard/(modules)/_body-metrics/components/BelowSafeMinimum';
import { LOCALE } from '@/app/copy';
import { calorieTargetName } from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';
import { useDailyTargets } from '@/app/(modules)/dashboard/(modules)/meal-plans/hooks';
import { useDictionary } from '@/app/providers/dictionary-provider';

/**
 * The list toolbar's "Targets: 2,058 kcal (Maintenance) · Balanced split";
 * hidden without.
 */
const MealPlanTargetsNote = () => {
  const { resources, dashboard } = useDictionary();
  const targets = useDailyTargets();

  if (!targets) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[13px] font-semibold text-muted-foreground">
        {interpolate(resources.mealPlans.targets, {
          kcal: formatAmount(targets.calories, LOCALE, 0),
          target: calorieTargetName(
            targets.target,
            dashboard.bodyMetrics.calories.targetNames,
            LOCALE,
          ),
          plan: dashboard.bodyMetrics.macros.plans[targets.plan],
        })}
      </p>
      {targets.target.belowSafeMinimum && (
        <BelowSafeMinimum safeMinimum={targets.safeMinimum} locale={LOCALE} />
      )}
    </div>
  );
};

export default MealPlanTargetsNote;
