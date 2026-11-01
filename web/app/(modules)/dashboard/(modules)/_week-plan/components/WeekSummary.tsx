'use client';

import { formatAmount, interpolate, pluralize } from '@/app/utils/helpers';

import { IDailyTargets } from '@/app/(modules)/dashboard/(modules)/meal-plans/interfaces';
import { IWeekSummary } from '@/app/(modules)/dashboard/(modules)/_week-plan/interfaces';
import MealPlanTargetsNote from '@/app/(modules)/dashboard/(modules)/meal-plans/components/MealPlanTargetsNote';
import { ON_TARGET_KCAL } from '@/app/(modules)/dashboard/(modules)/meal-plans/constants';
import Section from '@/app/components/layout/Section';
import StatTile from '@/app/components/display/StatTile';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  summary: IWeekSummary;
  targets?: IDailyTargets;
  lang: string;
}

/**
 * The daily average over planned days and, with a Calorie target, how many
 * of the seven days are on it. No weekly total.
 */
const WeekSummary = ({ summary, targets, lang }: IProps) => {
  const labels = useDictionary().weekPlan.summary;
  const kcal = (value: number) => formatAmount(value, lang, 0);
  const { average, plannedCount, onTargetCount } = summary;

  return (
    <Section
      id="week-summary"
      title={labels.title}
      actions={<MealPlanTargetsNote />}
    >
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <StatTile
          label={labels.average}
          value={average ? kcal(average.calories) : '—'}
          unit={
            targets
              ? interpolate(labels.ofKcal, { value: kcal(targets.calories) })
              : 'kcal'
          }
          hint={
            plannedCount
              ? pluralize(plannedCount, labels.averageOf, lang)
              : labels.noPlannedDays
          }
        />
        {onTargetCount !== undefined && (
          <StatTile
            label={labels.onTarget}
            value={`${onTargetCount}/${summary.planned.length}`}
            unit={interpolate(labels.within, { value: ON_TARGET_KCAL })}
            hint={labels.emptyOffTarget}
          />
        )}
      </div>
    </Section>
  );
};

export default WeekSummary;
