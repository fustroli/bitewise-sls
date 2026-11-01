'use client';

import DayPicker from '@/app/(modules)/dashboard/(modules)/_week-plan/components/DayPicker';
import { IMealPlanOption } from '@/app/(modules)/dashboard/(modules)/meal-plans/interfaces';
import LoadMealPlanDialog from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/LoadMealPlanDialog';
import ReplacesWarning from '@/app/(modules)/dashboard/(modules)/_week-plan/components/ReplacesWarning';
import { TStoredWeek } from '@/app/(modules)/dashboard/(modules)/_week-plan/validations';
import { plannedDaysAmong } from '@/app/(modules)/dashboard/(modules)/_week-plan/helpers';
import { pluralize } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useState } from 'react';

interface IProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMealPlanId?: string;
  /** Picked when the dialog opens. */
  initialDay: number;
  week: TStoredWeek;
  /** Monday to Sunday, long. */
  names: string[];
  /** Monday to Sunday, short. */
  shortNames: string[];
  lang: string;
  mealPlansHref: string;
  onLoad: (mealPlan: IMealPlanOption, days: number[]) => void;
}

/** Load meal plan onto chosen days, saying which planned days it replaces. */
const WeekLoadDialog = ({
  open,
  onOpenChange,
  initialMealPlanId,
  initialDay,
  week,
  names,
  shortNames,
  lang,
  mealPlansHref,
  onLoad,
}: IProps) => {
  const labels = useDictionary().weekPlan.load;
  const [days, setDays] = useState([initialDay]);

  return (
    <LoadMealPlanDialog
      open={open}
      onOpenChange={onOpenChange}
      initialMealPlanId={initialMealPlanId}
      description={labels.description}
      submitLabel={pluralize(days.length, labels.submit, lang)}
      submitDisabled={!days.length}
      mealPlansHref={mealPlansHref}
      onLoad={(mealPlan) => onLoad(mealPlan, days)}
    >
      <DayPicker
        label={labels.days}
        names={shortNames}
        value={days}
        onChange={setDays}
      />
      <ReplacesWarning days={plannedDaysAmong(week, days)} names={names} />
    </LoadMealPlanDialog>
  );
};

export default WeekLoadDialog;
