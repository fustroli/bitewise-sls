'use client';

import {
  PropsWithChildren,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  clearDay as clearWeekDay,
  copyDay,
  loadMealPlan,
  parseWeek,
  serializeWeek,
  setDays,
  weekPlanStorageKey,
  weekdayIndex,
  weekdayNames,
} from '@/app/(modules)/dashboard/(modules)/_week-plan/helpers';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import CopyDayDialog from '@/app/(modules)/dashboard/(modules)/_week-plan/components/CopyDayDialog';
import { IWeekPlanContext } from '@/app/(modules)/dashboard/(modules)/_week-plan/interfaces';
import { LOCALE } from '@/app/copy';
import { TDraftLine } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { TStoredWeek } from '@/app/(modules)/dashboard/(modules)/_week-plan/validations';
import { WEEK_PLAN_FROM_MEAL_PLAN_PARAM } from '@/app/(modules)/dashboard/(modules)/meal-plans/constants';
import WeekLoadDialog from '@/app/(modules)/dashboard/(modules)/_week-plan/components/WeekLoadDialog';
import { WeekPlanContext } from '@/app/(modules)/dashboard/(modules)/_week-plan/context';
import { toMealPlanId } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import { useLocalStorage } from '@/app/hooks/use-local-storage';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

interface IProps extends PropsWithChildren {
  mealPlansHref: string;
}

/**
 * The User's one Week plan, kept in this browser only, for the page's header
 * buttons and the week alike. Holds the Load meal plan and Copy day dialogs;
 * `?load=<mealPlanId>` (a Meal plan's "Add to week plan") opens Load with
 * that plan picked.
 */
export const WeekPlanProvider = ({ mealPlansHref, children }: IProps) => {
  const { user } = useUserContext();
  const lang = LOCALE;
  const [raw, setRaw] = useLocalStorage(weekPlanStorageKey(user.id));
  const [revision, setRevision] = useState(0);
  // Read on the client only: the week isn't rendered before hydration.
  const [today] = useState(() => weekdayIndex(new Date()));
  const [selectedDay, selectDay] = useState(today);
  const [loadDialog, setLoadDialog] = useState<{
    open: boolean;
    mealPlanId?: string;
    /** Remounts the dialog per opening, so it starts afresh. */
    opens: number;
  }>({ open: false, opens: 0 });
  const [copyDialog, setCopyDialog] = useState({ open: false, opens: 0 });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramMealPlanId = toMealPlanId(
    searchParams.get(WEEK_PLAN_FROM_MEAL_PLAN_PARAM),
  );

  const week = useMemo(
    () => (raw === undefined ? undefined : parseWeek(raw)),
    [raw],
  );
  // The editor reports changes from an effect, which runs after this: by
  // then it reaches the week just rendered.
  const weekRef = useRef(week);
  useLayoutEffect(() => {
    weekRef.current = week;
  });

  const names = useMemo(() => weekdayNames(lang, 'long'), [lang]);
  const shortNames = useMemo(() => weekdayNames(lang, 'short'), [lang]);

  const replaceWeek = useCallback(
    (next: TStoredWeek) => setRaw(serializeWeek(next)),
    [setRaw],
  );
  /** A change the day editor didn't make: it starts over from the store. */
  const changeWeek = useCallback(
    (change: (current: TStoredWeek) => TStoredWeek) => {
      if (!weekRef.current) return;
      replaceWeek(change(weekRef.current));
      setRevision((count) => count + 1);
    },
    [replaceWeek],
  );
  const saveDay = useCallback(
    (day: number, lines: TDraftLine[]) => {
      if (weekRef.current) replaceWeek(setDays(weekRef.current, [day], lines));
    },
    [replaceWeek],
  );

  // The param keeps the dialog open until it closes; then it is dropped, so
  // a reload doesn't ask again.
  const onLoadOpenChange = (open: boolean) => {
    if (open) return;
    setLoadDialog((current) => ({ ...current, open: false }));
    if (paramMealPlanId !== undefined) {
      router.replace(pathname, { scroll: false });
    }
  };

  const value = useMemo<IWeekPlanContext>(
    () => ({
      week,
      revision,
      names,
      shortNames,
      today,
      selectedDay,
      selectDay,
      saveDay,
      replaceWeek,
      clearDay: (day) => changeWeek((current) => clearWeekDay(current, day)),
      clearWeek: () => {
        setRaw(null);
        setRevision((count) => count + 1);
      },
      openLoad: (mealPlanId) =>
        setLoadDialog(({ opens }) => ({
          open: true,
          mealPlanId,
          opens: opens + 1,
        })),
      openCopy: () =>
        setCopyDialog(({ opens }) => ({ open: true, opens: opens + 1 })),
    }),
    [
      week,
      revision,
      names,
      shortNames,
      today,
      selectedDay,
      saveDay,
      replaceWeek,
      changeWeek,
      setRaw,
    ],
  );

  return (
    <WeekPlanContext.Provider value={value}>
      {children}
      {week && (
        <>
          <WeekLoadDialog
            key={
              paramMealPlanId === undefined
                ? `load-${loadDialog.opens}`
                : `load-meal-plan-${paramMealPlanId}`
            }
            open={loadDialog.open || paramMealPlanId !== undefined}
            onOpenChange={onLoadOpenChange}
            initialMealPlanId={paramMealPlanId ?? loadDialog.mealPlanId}
            initialDay={selectedDay}
            week={week}
            names={names}
            shortNames={shortNames}
            lang={lang}
            mealPlansHref={mealPlansHref}
            onLoad={({ mealIds }, days) =>
              changeWeek((current) => loadMealPlan(current, mealIds, days))
            }
          />
          <CopyDayDialog
            key={`copy-${copyDialog.opens}`}
            open={copyDialog.open}
            onOpenChange={(open) =>
              setCopyDialog((current) => ({ ...current, open }))
            }
            from={selectedDay}
            week={week}
            names={names}
            shortNames={shortNames}
            lang={lang}
            onCopy={(to) =>
              changeWeek((current) => copyDay(current, selectedDay, to))
            }
          />
        </>
      )}
    </WeekPlanContext.Provider>
  );
};
