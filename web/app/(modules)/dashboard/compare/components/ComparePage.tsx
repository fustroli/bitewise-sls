'use client';

import {
  COMPARISON_KINDS,
  COMPARISON_MAX_ITEMS,
} from '@/app/(modules)/dashboard/(modules)/_comparison/constants';
import {
  IChosenItem,
  TComparisonOptions,
} from '@/app/(modules)/dashboard/compare/components/compare.types';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/app/components/ui/button';
import { EComparisonKind } from '@/app/(modules)/dashboard/(modules)/_comparison/enums';
import EmptyState from '@/app/components/EmptyState';
import { IComparisonQuery } from '@/app/(modules)/dashboard/(modules)/_comparison/interfaces';
import { LOCALE } from '@/app/copy';
import Link from 'next/link';
import NutrientTable from '@/app/(modules)/dashboard/compare/components/NutrientTable';
import OverviewCards from '@/app/(modules)/dashboard/compare/components/OverviewCards';
import PageHeader from '@/app/components/layout/PageHeader';
import { Scale } from 'lucide-react';
import Section from '@/app/components/layout/Section';
import SegmentedControl from '@/app/components/SegmentedControl';
import { Skeleton } from '@/app/components/ui/skeleton';
import SlotPickers from '@/app/(modules)/dashboard/compare/components/SlotPickers';
import { comparisonSearch } from '@/app/(modules)/dashboard/(modules)/_comparison/helpers';
import { useComparisonItems } from '@/app/(modules)/dashboard/compare/hooks/use-comparison-items';
import { useDictionary } from '@/app/providers/dictionary-provider';

const LIST_ROUTES: Record<EComparisonKind, string> = {
  [EComparisonKind.INGREDIENTS]: '/ingredients',
  [EComparisonKind.MEALS]: '/meals',
  [EComparisonKind.MEAL_PLANS]: '/meal-plans',
};

const EMPTY_SLOTS = Array<string | null>(COMPARISON_MAX_ITEMS).fill(null);

interface IProps {
  initial: IComparisonQuery;
  /** Every record of each kind, for the slot pickers. */
  options: TComparisonOptions;
}

/** The kind switch, the three slots, the overview and the nutrient table. */
const ComparePage = ({ initial, options }: IProps) => {
  const labels = useDictionary().comparison;
  const lang = LOCALE;
  const router = useRouter();
  const pathname = usePathname();

  const [kind, setKind] = useState(initial.kind);
  const [picks, setPicks] = useState<
    Record<EComparisonKind, (string | null)[]>
  >(() => {
    const empty = Object.fromEntries(
      COMPARISON_KINDS.map((option) => [option, EMPTY_SLOTS]),
    ) as Record<EComparisonKind, (string | null)[]>;
    return {
      ...empty,
      [initial.kind]: EMPTY_SLOTS.map((_, slot) => initial.ids[slot] ?? null),
    };
  });

  const show = (nextKind: EComparisonKind, ids: (string | null)[]) =>
    router.replace(`${pathname}${comparisonSearch({ kind: nextKind, ids })}`, {
      scroll: false,
    });

  const switchKind = (nextKind: EComparisonKind) => {
    setKind(nextKind);
    show(nextKind, picks[nextKind]);
  };

  const pick = (slot: number, id: string | null) => {
    const ids = picks[kind].map((current, index) =>
      index === slot ? id : current,
    );
    setPicks({ ...picks, [kind]: ids });
    show(kind, ids);
  };

  const caches = useComparisonItems();
  const { records, missing, failed, request, retry } = caches[kind];
  const kindOptions = options[kind];

  // Picks that aren't among the options (gone, or never the User's) are
  // empty slots; the rest are fetched in full.
  const wanted = useMemo(
    () =>
      picks[kind].filter(
        (id): id is string =>
          id !== null && kindOptions.some((option) => option.id === id),
      ),
    [picks, kind, kindOptions],
  );
  useEffect(() => request(wanted), [request, wanted]);

  const isLoading = wanted.some(
    (id) =>
      !records.some((record) => record.id === id) &&
      !missing.includes(id) &&
      !failed.includes(id),
  );
  const hasFailed = wanted.some((id) => failed.includes(id));

  // An id the backend no longer returns is an empty slot.
  const chosen: IChosenItem[] = picks[kind].flatMap((id, slot) => {
    const item = records.find((record) => record.id === id);
    return item ? [{ slot, item }] : [];
  });
  const baseline = chosen.find(({ slot }) => slot === 0);

  const renderComparison = () => {
    if (hasFailed) {
      return (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border bg-card p-4"
        >
          <p className="text-sm text-destructive">{labels.loadError}</p>
          <Button type="button" variant="outline" onClick={retry}>
            {labels.retry}
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return <Skeleton className="h-64 w-full rounded-lg" />;
    }

    if (!baseline) {
      return (
        <div className="rounded-lg border bg-card">
          <EmptyState icon={Scale} title={labels.pickPrompt} />
        </div>
      );
    }

    return (
      <>
        <Section
          id="overview"
          title={labels.overview.title}
          description={labels.overview.description[kind]}
        >
          <OverviewCards kind={kind} chosen={chosen} lang={lang} />
        </Section>
        <NutrientTable chosen={chosen} lang={lang} />
      </>
    );
  };

  const kindSwitch = (className?: string) => (
    <SegmentedControl
      label={labels.kindLabel}
      value={kind}
      onChange={switchKind}
      options={COMPARISON_KINDS.map((option) => ({
        value: option,
        label: labels.kinds[option],
      }))}
      className={className}
    />
  );

  const renderBody = () => {
    if (kindOptions.length < 2) {
      return (
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={Scale}
            title={labels.empty[kind]}
            action={
              <Button asChild>
                <Link href={`/dashboard${LIST_ROUTES[kind]}`}>
                  {labels.empty.action[kind]}
                </Link>
              </Button>
            }
          />
        </div>
      );
    }

    return (
      <>
        <Section id="choose" title={labels.chooseTitle[kind]}>
          <SlotPickers items={kindOptions} ids={picks[kind]} onPick={pick} />
        </Section>
        {renderComparison()}
      </>
    );
  };

  return (
    <>
      <PageHeader
        title={labels.page.title}
        description={labels.page.description}
        actions={kindSwitch()}
        mobileActions={null}
      />
      <div className="-mb-2 md:hidden">
        {kindSwitch('grid w-full grid-cols-3 [&>*]:px-1')}
      </div>
      {renderBody()}
    </>
  );
};

export default ComparePage;
