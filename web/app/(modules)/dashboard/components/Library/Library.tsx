'use client';

import { CalendarDays, ChevronRight, Leaf, Utensils } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import { ILibraryCounts } from '@/app/(modules)/dashboard/interfaces';
import Link from 'next/link';
import Section from '@/app/components/layout/Section';
import { Skeleton } from '@/app/components/ui/skeleton';
import { cn } from '@/app/lib';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

interface IProps {
  /** Left out while loading. */
  counts?: ILibraryCounts;
}

const ITEMS = [
  { key: 'ingredients', route: '/ingredients', icon: Leaf },
  { key: 'meals', route: '/meals', icon: Utensils },
  { key: 'mealPlans', route: '/meal-plans', icon: CalendarDays },
] as const;

/** What each step needs of the one before; the first needs nothing. */
const PREREQUISITES = {
  ingredients: undefined,
  meals: 'ingredients',
  mealPlans: 'meals',
} as const;

/**
 * Links to the three lists with their counts. A User who hasn't added Body
 * stats yet is starting out: the lists are steps, each unlocked by the last.
 */
const Library = ({ counts }: IProps) => {
  const { dashboard } = useDictionary();
  const labels = dashboard.library;
  const { user } = useUserContext();
  const href = (route: string) => `/dashboard${route}`;
  const isStarting = !user.bodyStats?.heightCm || !user.bodyStats?.weightKg;

  if (isStarting && counts) {
    return (
      <Section
        id="library"
        title={labels.buildTitle}
        description={labels.buildDescription}
      >
        <ol className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {ITEMS.map(({ key, route }, index) => {
            const step = labels.steps[key];
            const prerequisite = PREREQUISITES[key];
            const isLocked = !!prerequisite && counts[prerequisite] === 0;

            return (
              <li
                key={key}
                className="flex flex-col gap-3.5 rounded-lg border bg-card p-5"
              >
                <span
                  className={cn(
                    'text-xs font-extrabold uppercase tracking-wider',
                    isLocked ? 'text-muted-foreground' : 'text-primary',
                  )}
                >
                  {interpolate(labels.step, { n: index + 1 })}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-extrabold">{step.title}</span>
                  <span className="text-sm leading-normal text-muted-foreground">
                    {step.description}
                  </span>
                </div>
                {isLocked && 'needs' in step ? (
                  <span className="flex min-h-11 items-center self-start rounded-md border px-4 text-sm font-bold text-muted-foreground">
                    {step.needs}
                  </span>
                ) : (
                  <Button asChild className="self-start">
                    <Link href={href(route)}>{step.action}</Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </Section>
    );
  }

  return (
    <Section id="library" title={labels.title} description={labels.description}>
      <ul className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
        {ITEMS.map(({ key, route, ...item }) => (
          <li key={key}>
            <Link
              href={href(route)}
              className="flex items-center gap-4 rounded-lg border bg-card p-5 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-11 items-center justify-center rounded-[12px] bg-accent text-accent-foreground">
                <item.icon aria-hidden className="size-5" />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-sm font-bold text-muted-foreground">
                  {dashboard.sidebar[key]}
                </span>
                {counts ? (
                  <span className="text-2xl font-extrabold">{counts[key]}</span>
                ) : (
                  <Skeleton className="mt-1 h-7 w-10" />
                )}
              </span>
              <ChevronRight
                aria-hidden
                className="size-[18px] text-muted-foreground"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default Library;
