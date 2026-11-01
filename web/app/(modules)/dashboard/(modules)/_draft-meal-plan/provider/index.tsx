'use client';

import {
  EMPTY_DRAFT,
  draftStorageKey,
  mealPlanDraft,
  parseDraft,
  serializeDraft,
  toMealPlanId,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { DRAFT_FROM_MEAL_PLAN_PARAM } from '@/app/(modules)/dashboard/(modules)/meal-plans/constants';
import { DraftMealPlanContext } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/context';
import { IDraftMealPlanContext } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import LoadMealPlanDialog from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/LoadMealPlanDialog';
import { TStoredDraft } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useLocalStorage } from '@/app/hooks/use-local-storage';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

interface IProps extends PropsWithChildren {
  mealPlansHref: string;
}

/**
 * The User's one Draft meal plan, kept in this browser only, for the
 * dashboard's header buttons and editor alike. Holds the single Load meal
 * plan dialog; `?draft=<mealPlanId>` (a Meal plan's "Open as draft") opens it
 * with that plan picked.
 */
export const DraftMealPlanProvider = ({ mealPlansHref, children }: IProps) => {
  const { user } = useUserContext();
  const labels = useDictionary().draftMealPlan.load;
  const [raw, setRaw] = useLocalStorage(draftStorageKey(user.id));
  const [loads, setLoads] = useState(0);
  const [loadDialog, setLoadDialog] = useState<{
    open: boolean;
    mealPlanId?: string;
    /** Remounts the dialog per opening, so it starts afresh. */
    opens: number;
  }>({ open: false, opens: 0 });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramMealPlanId = toMealPlanId(
    searchParams.get(DRAFT_FROM_MEAL_PLAN_PARAM),
  );

  const save = useCallback(
    (draft: TStoredDraft) => setRaw(serializeDraft(draft)),
    [setRaw],
  );
  const load = useCallback(
    (draft: TStoredDraft) => {
      save(draft);
      setLoads((count) => count + 1);
    },
    [save],
  );
  const openLoad = useCallback(
    (mealPlanId?: string) =>
      setLoadDialog(({ opens }) => ({
        open: true,
        mealPlanId,
        opens: opens + 1,
      })),
    [],
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

  const stored = useMemo(
    () => (raw === undefined ? undefined : parseDraft(raw)),
    [raw],
  );

  const lineCount = stored?.lines.length ?? 0;

  const value = useMemo<IDraftMealPlanContext>(
    () => ({
      stored,
      loads,
      start: () => save(EMPTY_DRAFT),
      save,
      load,
      clear: () => setRaw(null),
      openLoad,
      mealPlansHref,
    }),
    [stored, loads, save, load, setRaw, openLoad, mealPlansHref],
  );

  return (
    <DraftMealPlanContext.Provider value={value}>
      {children}
      <LoadMealPlanDialog
        key={
          paramMealPlanId === undefined
            ? loadDialog.opens
            : `meal-plan-${paramMealPlanId}`
        }
        open={loadDialog.open || paramMealPlanId !== undefined}
        onOpenChange={onLoadOpenChange}
        initialMealPlanId={paramMealPlanId ?? loadDialog.mealPlanId}
        mealPlansHref={mealPlansHref}
        onLoad={({ mealIds }) => load(mealPlanDraft(mealIds))}
      >
        {lineCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {interpolate(labels.replaceWarning, { count: lineCount })}
          </p>
        )}
      </LoadMealPlanDialog>
    </DraftMealPlanContext.Provider>
  );
};
