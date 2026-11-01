import {
  DRAFT_FROM_MEAL_PLAN_PARAM,
  WEEK_PLAN_FROM_MEAL_PLAN_PARAM,
} from '@/app/(modules)/dashboard/(modules)/meal-plans/constants';
import { formatAmount, pluralize } from '@/app/utils/helpers';
import {
  mealNutrition,
  mealPlanNutrition,
} from '@/app/(modules)/dashboard/(modules)/_nutrition/helpers';

import { Button } from '@/app/components/ui/button';
import ExpandableCard from '@/app/components/ExpandableCard';
import { IMealPlan } from '@/app/(modules)/dashboard/(modules)/meal-plans/interfaces';
import { IResourceRowContext } from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import Link from 'next/link';
import MacroAmounts from '@/app/components/nutrition/MacroAmounts';
import MealPlanTargets from '@/app/(modules)/dashboard/(modules)/meal-plans/components/Card/MealPlanTargets';

interface IProps extends IResourceRowContext {
  mealPlan: IMealPlan;
  bodyStatsHref: string;
}

/** One day: its totals against the targets, its Meals behind a toggle. */
const MealPlanCard = ({
  mealPlan,
  actions,
  dictionary,
  lang,
  bodyStatsHref,
}: IProps) => {
  const labels = dictionary.resources.mealPlans.card;
  const macroNames = dictionary.dashboard.bodyMetrics.macros.macros;
  const count = mealPlan.meals.length;
  const amount = (value: number) => formatAmount(value, lang);
  const mealsHref = `/dashboard/meals`;

  const header = (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-6 md:py-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-extrabold">{mealPlan.name}</h2>
          <p className="text-[13px] text-muted-foreground">
            {pluralize(count, labels.meals, lang)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-10 px-3.5">
            <Link
              href={`/dashboard/week?${WEEK_PLAN_FROM_MEAL_PLAN_PARAM}=${mealPlan.id}`}
            >
              {labels.addToWeekPlan}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 px-3.5">
            <Link
              href={`/dashboard?${DRAFT_FROM_MEAL_PLAN_PARAM}=${mealPlan.id}`}
            >
              {labels.openAsDraft}
            </Link>
          </Button>
          {actions}
        </div>
      </div>
      <MealPlanTargets
        total={mealPlanNutrition(mealPlan)}
        lang={lang}
        bodyStatsHref={bodyStatsHref}
      />
    </div>
  );

  return (
    <ExpandableCard
      className="w-full"
      header={header}
      showLabel={pluralize(count, labels.show, lang)}
      hideLabel={labels.hide}
    >
      <ol className="flex flex-col px-4 pb-3.5 md:px-6">
        {mealPlan.meals.map((meal, index) => {
          const nutrition = mealNutrition(meal);

          return (
            <li
              key={meal.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t py-3 text-sm first:border-t-0"
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-extrabold text-secondary-foreground"
                >
                  {index + 1}
                </span>
                <Link
                  href={`${mealsHref}?search=${encodeURIComponent(meal.name)}`}
                  className="font-bold hover:text-primary hover:underline"
                >
                  {meal.name}
                </Link>
              </span>
              <span className="flex items-center gap-4">
                <MacroAmounts
                  amounts={{
                    protein: amount(nutrition.protein),
                    carbs: amount(nutrition.totalCarbohydrates),
                    fat: amount(nutrition.totalFat),
                  }}
                  names={macroNames}
                />
                <span className="min-w-[76px] text-right font-extrabold">
                  {formatAmount(nutrition.calories, lang, 0)} kcal
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </ExpandableCard>
  );
};

export default MealPlanCard;
