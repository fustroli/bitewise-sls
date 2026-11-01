'use client';

import { Copy, Eraser } from 'lucide-react';
import {
  IDraftOptions,
  IDraftSources,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';

import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import DraftLinesEditor from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftLinesEditor';
import { INutrition } from '@/app/(modules)/dashboard/(modules)/_nutrition/interfaces';
import MealPlanTargets from '@/app/(modules)/dashboard/(modules)/meal-plans/components/Card/MealPlanTargets';
import { TDraftLine } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { useCallback } from 'react';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useWeekPlan } from '@/app/(modules)/dashboard/(modules)/_week-plan/context';

interface IProps {
  day: number;
  name: string;
  isToday: boolean;
  lines: TDraftLine[];
  total: INutrition;
  options: IDraftOptions;
  sources: IDraftSources;
  bodyStatsHref: string;
  lang: string;
}

/** The selected day: its totals against the targets and its editable lines. */
const WeekDay = ({
  day,
  name,
  isToday,
  lines,
  total,
  options,
  sources,
  bodyStatsHref,
  lang,
}: IProps) => {
  const labels = useDictionary().weekPlan;
  const { revision, saveDay, clearDay, openCopy } = useWeekPlan();
  const onChange = useCallback(
    (next: TDraftLine[]) => saveDay(day, next),
    [day, saveDay],
  );

  return (
    <section aria-labelledby="week-day-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2
            id="week-day-heading"
            className="text-lg font-extrabold md:text-[22px]"
          >
            {name}
          </h2>
          {isToday && (
            <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-extrabold text-background">
              {labels.days.today}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openCopy}>
            <Copy aria-hidden />
            <span className="md:hidden">{labels.day.copyShort}</span>
            <span className="hidden md:inline">{labels.day.copy}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!lines.length}
            onClick={() => clearDay(day)}
          >
            <Eraser aria-hidden />
            {labels.day.clear}
          </Button>
        </div>
      </div>

      <Card className="flex flex-col gap-6 p-4 md:p-6">
        <MealPlanTargets
          total={total}
          lang={lang}
          bodyStatsHref={bodyStatsHref}
        />
        {/* Reads its lines once on mount: another day, or a change made
            outside it, mounts it afresh. */}
        <DraftLinesEditor
          key={`${day}-${revision}`}
          initial={lines}
          options={options}
          sources={sources}
          label={name}
          onChange={onChange}
        />
      </Card>
    </section>
  );
};

export default WeekDay;
