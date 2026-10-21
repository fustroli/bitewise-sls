import {
  IBodyMetrics,
  IMacroPlan,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/interfaces';
import {
  calorieTargetName,
  formatBmi,
  formatBodyFat,
  formatCalories,
  formatGrams,
  formatWeight,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';

import BelowSafeMinimum from '@/app/(modules)/dashboard/(modules)/_body-metrics/components/BelowSafeMinimum';
import PlaceholderTile from '@/app/components/display/PlaceholderTile';
import StatTile from '@/app/components/display/StatTile';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  metrics: IBodyMetrics;
  plan?: IMacroPlan;
  locale: string;
}

export const SUMMARY_GRID_CLASS =
  'grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(230px,1fr))] md:gap-4';

/**
 * The Calorie target, protein, BMI and body fat; a dashed tile for each
 * unknown.
 */
const SummaryTiles = ({ metrics, plan, locale }: IProps) => {
  const { dashboard } = useDictionary();
  const labels = dashboard.summary;
  const { bodyMetrics } = dashboard;
  const { calories, bmi, bodyFat } = metrics;

  return (
    <div className={SUMMARY_GRID_CLASS}>
      {calories ? (
        <StatTile
          label={
            calories.target.kgPerWeek === 0
              ? labels.maintenance
              : labels.calorieTarget
          }
          value={formatCalories(calories.target.kcalPerDay, locale)}
          unit={bodyMetrics.calories.kcalPerDay}
          hint={
            <span className="flex flex-col gap-1.5">
              {calories.target.kgPerWeek === 0
                ? labels.maintenanceHint
                : calorieTargetName(
                    calories.target,
                    bodyMetrics.calories.targetNames,
                    locale,
                  )}
              {calories.target.belowSafeMinimum && (
                <BelowSafeMinimum
                  as="span"
                  safeMinimum={calories.safeMinimum}
                  locale={locale}
                />
              )}
            </span>
          }
        />
      ) : (
        <PlaceholderTile
          label={labels.maintenance}
          hint={labels.needs.maintenance}
        />
      )}
      {plan ? (
        <StatTile
          label={labels.protein}
          value={formatGrams(plan.protein.grams, locale)}
          unit={labels.gramsPerDay}
          hint={interpolate(labels.proteinHint, {
            plan: bodyMetrics.macros.plans[plan.plan],
          })}
        />
      ) : (
        <PlaceholderTile label={labels.protein} hint={labels.needs.protein} />
      )}
      {bmi ? (
        <StatTile
          label={bodyMetrics.bmi.title}
          value={formatBmi(bmi.value, locale)}
          badge={bodyMetrics.bmi.categories[bmi.category]}
          hint={interpolate(labels.healthyWeight, {
            min: formatWeight(bmi.healthyWeight.minKg, locale),
            max: formatWeight(bmi.healthyWeight.maxKg, locale),
          })}
        />
      ) : (
        <PlaceholderTile
          label={bodyMetrics.bmi.title}
          hint={labels.needs.bmi}
        />
      )}
      {bodyFat ? (
        <StatTile
          label={bodyMetrics.bodyFat.title}
          value={formatBodyFat(bodyFat.percent, locale)}
          badge={bodyMetrics.bodyFat.categories[bodyFat.category]}
          hint={interpolate(labels.masses, {
            fat: formatWeight(bodyFat.fatMassKg, locale),
            lean: formatWeight(bodyFat.leanMassKg, locale),
          })}
        />
      ) : (
        <PlaceholderTile
          label={bodyMetrics.bodyFat.title}
          hint={labels.needs.bodyFat}
        />
      )}
    </div>
  );
};

export default SummaryTiles;
