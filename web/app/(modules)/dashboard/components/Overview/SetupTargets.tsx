import { Check, ChevronRight } from 'lucide-react';

import { IBodyStats } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import Link from 'next/link';
import { SETUP_STEP_COUNT } from '@/app/(modules)/dashboard/components/Overview/overview.constants';
import { interpolate } from '@/app/utils/helpers';
import { progressPercent } from '@/app/utils/helpers';
import { setupProgress } from '@/app/(modules)/dashboard/components/Overview/overview.helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';

interface IProps {
  bodyStats?: Partial<IBodyStats>;
  dateOfBirth?: string;
  bodyStatsHref: string;
  personalInformationHref: string;
}

/** The three Profile steps that fill in the dashboard, with progress. */
const SetupTargets = ({
  bodyStats,
  dateOfBirth,
  bodyStatsHref,
  personalInformationHref,
}: IProps) => {
  const labels = useDictionary().dashboard.setup;
  const done = setupProgress(bodyStats, dateOfBirth);
  const doneCount = Object.values(done).filter(Boolean).length;
  // Activity level set, only the date of birth missing: that's elsewhere.
  const activityHref =
    bodyStats?.activityLevel && !dateOfBirth
      ? personalInformationHref
      : bodyStatsHref;

  const steps = [
    { key: 'bodyStats', href: bodyStatsHref },
    { key: 'activity', href: activityHref },
    { key: 'measurements', href: bodyStatsHref },
  ] as const;

  return (
    <section
      aria-labelledby="setup-heading"
      className="flex flex-wrap gap-6 rounded-lg border bg-card p-5 md:gap-8 md:p-7"
    >
      <div className="flex flex-[1_1_280px] flex-col gap-3">
        <h2 id="setup-heading" className="text-lg font-extrabold md:text-xl">
          {labels.title}
        </h2>
        <p className="text-[15px] leading-relaxed text-secondary-foreground">
          {labels.description}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex justify-between text-[13px] font-bold text-secondary-foreground">
            <span>{labels.progress}</span>
            <span>
              {interpolate(labels.progressCount, {
                done: doneCount,
                total: SETUP_STEP_COUNT,
              })}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={labels.progress}
            aria-valuemin={0}
            aria-valuemax={SETUP_STEP_COUNT}
            aria-valuenow={doneCount}
            className="h-2 rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${progressPercent(doneCount, SETUP_STEP_COUNT)}%`,
              }}
            />
          </div>
        </div>
      </div>
      <ol className="flex flex-[2_1_420px] flex-col gap-2">
        {steps.map(({ key, href }, index) => {
          const step = labels.steps[key];

          return (
            <li key={key}>
              <Link
                href={href}
                className="flex min-h-[72px] items-center gap-4 rounded-md border bg-card px-4 py-3.5 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {done[key] ? (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check aria-label={labels.done} className="size-4" />
                  </span>
                ) : (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-input text-[13px] font-extrabold text-secondary-foreground">
                    {index + 1}
                  </span>
                )}
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-extrabold">
                    {step.title}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {step.description}
                  </span>
                </span>
                <span className="hidden text-[13px] font-bold text-primary sm:inline">
                  {step.unlocks}
                </span>
                <ChevronRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground sm:hidden"
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default SetupTargets;
