'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { interpolate, pluralize } from '@/app/utils/helpers';

import { Button } from '@/app/components/ui/button';
import DayPicker from '@/app/(modules)/dashboard/(modules)/_week-plan/components/DayPicker';
import ReplacesWarning from '@/app/(modules)/dashboard/(modules)/_week-plan/components/ReplacesWarning';
import { TStoredWeek } from '@/app/(modules)/dashboard/(modules)/_week-plan/validations';
import { plannedDaysAmong } from '@/app/(modules)/dashboard/(modules)/_week-plan/helpers';
import { toast } from '@/app/hooks/use-toast';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useState } from 'react';

interface IProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The day to copy. */
  from: number;
  week: TStoredWeek;
  /** Monday to Sunday, long. */
  names: string[];
  /** Monday to Sunday, short. */
  shortNames: string[];
  lang: string;
  onCopy: (to: number[]) => void;
}

/** Copy day to…: replaces the chosen days with a copy of `from`. */
const CopyDayDialog = ({
  open,
  onOpenChange,
  from,
  week,
  names,
  shortNames,
  lang,
  onCopy,
}: IProps) => {
  const { weekPlan, resourceTable } = useDictionary();
  const labels = weekPlan.copy;
  const [days, setDays] = useState<number[]>([]);
  const day = names[from];

  const copy = () => {
    onCopy(days);
    onOpenChange(false);
    toast({
      variant: 'success',
      description: interpolate(labels.copied, { day }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{interpolate(labels.title, { day })}</DialogTitle>
          <DialogDescription>
            {interpolate(labels.description, { day })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <DayPicker
            label={labels.days}
            names={shortNames}
            value={days}
            onChange={setDays}
            disabledDay={from}
          />
          <ReplacesWarning days={plannedDaysAmong(week, days)} names={names} />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {resourceTable.cancel}
          </Button>
          <Button type="button" disabled={!days.length} onClick={copy}>
            {pluralize(days.length, labels.submit, lang)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyDayDialog;
