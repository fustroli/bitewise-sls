'use client';

import {
  GOAL_TICK_PERCENT,
  goalBarPercent,
} from '@/app/(modules)/dashboard/components/Overview/overview.helpers';
import {
  ICalorieTarget,
  ICalories,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/interfaces';
import MissingInputs, {
  IMissingInputs,
} from '@/app/(modules)/dashboard/components/Overview/MissingInputs';
import {
  formatCalories,
  formatKgPerWeek,
  formatPercent,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/helpers';

import BelowSafeMinimum from '@/app/(modules)/dashboard/(modules)/_body-metrics/components/BelowSafeMinimum';
import { Card } from '@/app/components/ui/card';
import CardHeading from '@/app/(modules)/dashboard/components/Overview/CardHeading';
import Chip from '@/app/components/display/Chip';
import { ECalorieTarget } from '@/app/(modules)/dashboard/(modules)/_user/enums';
import SegmentedControl from '@/app/components/SegmentedControl';
import { cn } from '@/app/lib';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useState } from 'react';

type TDirection = 'lose' | 'gain';

interface IProps {
  calories?: ICalories;
  onPick: (target: ECalorieTarget) => void;
  missing: IMissingInputs;
  locale: string;
}

interface IRowProps {
  target: ICalorieTarget;
  name: string;
  detail: string;
  safeMinimum: number;
  picked: boolean;
  onPick: (target: ECalorieTarget) => void;
  locale: string;
}

/** One Calorie target; clicking it makes it the User's. */
const TargetRow = ({
  target,
  name,
  detail,
  safeMinimum,
  picked,
  onPick,
  locale,
}: IRowProps) => {
  const labels = useDictionary().dashboard.bodyMetrics.calories;

  return (
    <li className="border-t">
      <button
        type="button"
        aria-pressed={picked}
        onClick={() => onPick(target.target)}
        className={cn(
          '-mx-2 my-1 flex w-[calc(100%+1rem)] flex-col gap-2.5 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
          picked && 'bg-accent hover:bg-accent',
        )}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="flex flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold md:text-[15px]">{name}</span>
              {picked && (
                <Chip className="bg-primary text-primary-foreground">
                  {labels.picked}
                </Chip>
              )}
            </span>
            <span className="text-xs text-muted-foreground md:text-[13px]">
              {detail}
            </span>
          </span>
          <span className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-sm md:text-[15px]">
              <strong className="font-extrabold">
                {formatCalories(target.kcalPerDay, locale)}
              </strong>{' '}
              <span className="text-muted-foreground">{labels.kcalPerDay}</span>
            </span>
            <span className="text-xs text-muted-foreground md:text-[13px]">
              {interpolate(labels.ofMaintenance, {
                percent: formatPercent(target.percentOfMaintenance, locale),
              })}
            </span>
          </span>
        </span>
        <span
          aria-hidden
          className="relative block h-1.5 rounded-full bg-muted"
        >
          <span
            className={cn(
              'block h-full rounded-full',
              target.belowSafeMinimum ? 'bg-warning' : 'bg-primary',
            )}
            style={{
              width: `${goalBarPercent(target.percentOfMaintenance)}%`,
            }}
          />
          <span
            className="absolute -top-[3px] h-3 w-0.5 bg-foreground/35"
            style={{ left: `${GOAL_TICK_PERCENT}%` }}
          />
        </span>
        {target.belowSafeMinimum && (
          <BelowSafeMinimum
            as="span"
            safeMinimum={safeMinimum}
            locale={locale}
          />
        )}
      </button>
    </li>
  );
};

/**
 * Maintenance and the Calorie targets for losing or gaining weight; the
 * User picks theirs by clicking its row.
 */
const CaloriesByGoalCard = ({ calories, onPick, missing, locale }: IProps) => {
  const labels = useDictionary().dashboard.bodyMetrics.calories;
  const [direction, setDirection] = useState<TDirection>(() =>
    calories && calories.target.kgPerWeek > 0 ? 'gain' : 'lose',
  );
  const names = direction === 'lose' ? labels.loseTargets : labels.gainTargets;

  return (
    <Card className="flex flex-col gap-4 p-4 md:gap-5 md:p-6">
      <CardHeading
        title={labels.title}
        description={calories && labels.pick}
        aside={
          calories && (
            <SegmentedControl
              label={labels.goal}
              value={direction}
              onChange={setDirection}
              options={[
                { value: 'lose', label: labels.lose },
                { value: 'gain', label: labels.gain },
              ]}
            />
          )
        }
      />
      {calories ? (
        <>
          <ul>
            {[
              {
                target: calories.maintenanceTarget,
                name: labels.maintenance,
                detail: labels.maintenanceHint,
              },
              ...calories[direction].map((target) => ({
                target,
                name: names[target.pace],
                detail: interpolate(labels.kgPerWeek, {
                  value: formatKgPerWeek(target.kgPerWeek, locale),
                }),
              })),
            ].map(({ target, name, detail }) => (
              <TargetRow
                key={target.target}
                target={target}
                name={name}
                detail={detail}
                safeMinimum={calories.safeMinimum}
                picked={target.target === calories.target.target}
                onPick={onPick}
                locale={locale}
              />
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {interpolate(labels.tickNote, {
              kcal: formatCalories(calories.maintenance, locale),
            })}
          </p>
        </>
      ) : (
        <MissingInputs {...missing} />
      )}
    </Card>
  );
};

export default CaloriesByGoalCard;
