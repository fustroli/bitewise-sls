'use client';

import {
  isDraftSettled,
  resolveDraft,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import { useEffect, useMemo, useState } from 'react';

import { DRAFT_SECTION_ID } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/constants';
import DraftMealPlanEditor from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftMealPlanEditor';
import DraftMealPlanSkeleton from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftMealPlanSkeleton';
import DraftRecordsError from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftRecordsError';
import DraftStartCard from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftStartCard';
import { IDraftOptions } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useDraftMealPlan } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/context';
import { useDraftRecords } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/hooks';
import { useHydrated } from '@/app/hooks/use-hydrated';

interface IProps {
  options: IDraftOptions;
  /** Where to complete the Body stats that Maintenance calories need. */
  profileHref: string;
}

/**
 * The draft's editor once there is a draft. Without one the header's buttons
 * start it; at phone width a card repeats them here.
 */
const DraftMealPlan = ({ options, profileHref }: IProps) => {
  const { stored, loads, save, clear, openLoad } = useDraftMealPlan();
  const { sources, request, hasFailed, retry } = useDraftRecords();

  // Every line's item is fetched by id: the stored ones, and each new pick.
  useEffect(() => {
    if (stored) request(stored.lines);
  }, [stored, request]);

  const resolved = useMemo(
    () => stored && resolveDraft(stored, sources),
    [stored, sources],
  );

  // The editor reads its draft once, so it mounts (and, per load, remounts)
  // only once the draft's items are in: what's gone is dropped first.
  const [readyLoads, setReadyLoads] = useState<number>();
  if (stored && isDraftSettled(stored.lines, sources) && readyLoads !== loads)
    setReadyLoads(loads);

  // This boundary can hydrate after the provider has read the store: until
  // it has, it shows what the server rendered.
  const isHydrated = useHydrated();

  if (stored === undefined || !isHydrated) return <DraftMealPlanSkeleton />;

  if (!resolved) return <DraftStartCard />;

  if (readyLoads !== loads) {
    return hasFailed ? (
      <DraftRecordsError onRetry={retry} />
    ) : (
      <Skeleton className="h-[136px] w-full rounded-lg" />
    );
  }

  return (
    <section id={DRAFT_SECTION_ID} className="scroll-mt-20">
      <DraftMealPlanEditor
        key={loads}
        initial={resolved}
        options={options}
        sources={sources}
        profileHref={profileHref}
        onSave={save}
        onClear={clear}
        onOpenLoad={() => openLoad()}
      />
    </section>
  );
};

export default DraftMealPlan;
