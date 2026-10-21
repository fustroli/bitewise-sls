'use client';

import {
  ICalories,
  IMacroPlan,
  IMacros,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/interfaces';
import MissingInputs, {
  IMissingInputs,
} from '@/app/(modules)/dashboard/components/Overview/MissingInputs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  calorieTargetName,
  formatGrams,
  formatPercent,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';

import BelowSafeMinimum from '@/app/(modules)/dashboard/(modules)/_body-metrics/components/BelowSafeMinimum';
import { Card } from '@/app/components/ui/card';
import CardHeading from '@/app/(modules)/dashboard/components/Overview/CardHeading';
import { EMacroPlan } from '@/app/(modules)/dashboard/(modules)/_user/enums';
import MacroBar from '@/app/components/nutrition/MacroBar';
import { MacroSwatch } from '@/app/components/nutrition/MacroLegend';
import SubtleStat from '@/app/components/display/SubtleStat';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useId } from 'react';

const MACROS = ['protein', 'carbs', 'fat'] as const;
const PERCENT = 100;

interface IProps {
  macros?: IMacros;
  /** Holds the Calorie target `macros` split; set whenever `macros` is. */
  calories?: ICalories;
  /** The picked plan; set whenever `macros` is. */
  plan?: IMacroPlan;
  onPlanChange: (plan: EMacroPlan) => void;
  missing: IMissingInputs;
  locale: string;
}

/**
 * The picked Macro plan at the picked Calorie target, with the sugar and fat
 * caps.
 */
const MacrosCard = ({
  macros,
  calories,
  plan,
  onPlanChange,
  missing,
  locale,
}: IProps) => {
  const { macros: labels, calories: calorieLabels } =
    useDictionary().dashboard.bodyMetrics;
  const selectId = useId();
  const target = calories?.target;

  const ofEnergy = (percent: number) =>
    interpolate(labels.ofEnergy, { percent: formatPercent(percent, locale) });
  const limit = (grams: number) =>
    interpolate(labels.limit, { value: formatGrams(grams, locale) });

  return (
    <Card className="flex flex-col gap-4 p-4 md:gap-5 md:p-6">
      <CardHeading
        title={
          target && target.kgPerWeek !== 0
            ? interpolate(labels.titleAtTarget, {
                target: calorieTargetName(
                  target,
                  calorieLabels.targetNames,
                  locale,
                ),
              })
            : labels.title
        }
        aside={
          macros &&
          plan && (
            <div className="flex items-center gap-2">
              <label
                htmlFor={selectId}
                className="text-[13px] font-semibold text-muted-foreground"
              >
                {labels.split}
              </label>
              <Select
                value={plan.plan}
                onValueChange={(value) => onPlanChange(value as EMacroPlan)}
              >
                <SelectTrigger
                  id={selectId}
                  className="h-10 w-auto gap-2 px-3 text-[13px] font-bold"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {macros.plans.map((option) => (
                    <SelectItem key={option.plan} value={option.plan}>
                      {labels.plans[option.plan]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
      />
      {macros && plan ? (
        <>
          {calories?.target.belowSafeMinimum && (
            <BelowSafeMinimum
              safeMinimum={calories.safeMinimum}
              locale={locale}
            />
          )}
          <MacroBar
            heightClassName="h-3 md:h-3.5"
            shares={{
              protein: plan.protein.percent / PERCENT,
              carbs: plan.carbs.percent / PERCENT,
              fat: plan.fat.percent / PERCENT,
            }}
          />
          <ul>
            {MACROS.map((macro) => (
              <li
                key={macro}
                className="flex items-center justify-between gap-3 border-t py-3.5"
              >
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                  <MacroSwatch macro={macro} />
                  <span className="text-[15px] font-bold">
                    {labels.macros[macro]}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {ofEnergy(plan[macro].percent)}
                  </span>
                </span>
                <span className="whitespace-nowrap text-[15px]">
                  <strong className="font-extrabold">
                    {formatGrams(plan[macro].grams, locale)}
                  </strong>{' '}
                  <span className="text-muted-foreground">
                    {labels.gramsPerDay}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <SubtleStat
              label={labels.sugarLimit}
              value={limit(macros.sugarMaxGrams)}
            />
            <SubtleStat
              label={labels.saturatedFatLimit}
              value={limit(macros.saturatedFatMaxGrams)}
            />
          </div>
        </>
      ) : (
        <MissingInputs {...missing} />
      )}
    </Card>
  );
};

export default MacrosCard;
