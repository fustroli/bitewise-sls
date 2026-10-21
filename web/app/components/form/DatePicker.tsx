'use client';

import FieldFrame, {
  FieldControl,
  IFieldProps,
} from '@/app/components/form/FieldFrame';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';

import { Button } from '@/app/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { FROM_YEAR } from '@/app/utils/constants';
import { FieldValues } from 'react-hook-form';
import { Skeleton } from '@/app/components/ui/skeleton';
import { cn } from '@/app/lib';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { useEffect } from 'react';

const loadCalendar = () =>
  import('@/app/components/ui/calendar').then((mod) => mod.Calendar);

/**
 * react-day-picker is only needed once the popover opens, so it loads lazily.
 * The fallback has the calendar's size (7 × 32px days + padding, 6 weeks), so
 * the popover doesn't jump when it arrives.
 */
const Calendar = dynamic(loadCalendar, {
  loading: () => <Skeleton className="m-3 h-[300px] w-[224px]" />,
});

interface IProps<T extends FieldValues> extends IFieldProps<T> {
  label?: string;
}
const DatePicker = <T extends FieldValues>({
  control,
  name,
  label,
}: IProps<T>) => {
  // Fetch the calendar as soon as the picker shows, before it's opened.
  useEffect(() => {
    void loadCalendar();
  }, []);

  return (
    <FieldFrame
      control={control}
      name={name}
      label={label}
      className="flex flex-col"
    >
      {(field) => (
        <Popover>
          <PopoverTrigger asChild>
            <FieldControl>
              <Button
                type="button"
                variant={'outline'}
                className={cn(
                  'w-[200px] pl-3 text-left font-normal',
                  !field.value && 'text-muted-foreground',
                )}
              >
                {field.value ? (
                  format(field.value, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto size-4 opacity-50" />
              </Button>
            </FieldControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              captionLayout="dropdown-buttons"
              weekStartsOn={1}
              selected={new Date(field.value as string)}
              onSelect={field.onChange}
              disabled={(date) =>
                date > new Date() || date < new Date('1900-01-01')
              }
              initialFocus
              fromYear={FROM_YEAR}
              toYear={new Date().getFullYear()}
            />
          </PopoverContent>
        </Popover>
      )}
    </FieldFrame>
  );
};

export default DatePicker;
