'use client';

import {
  useBodyMetrics,
  useTargets,
} from '@/app/(modules)/dashboard/(modules)/_body-metrics/hooks';

import { BODY_FAT_FIELDS } from '@/app/(modules)/dashboard/(modules)/_body-metrics/constants';
import BmiCard from '@/app/(modules)/dashboard/components/Overview/BmiCard';
import BodyFatCard from '@/app/(modules)/dashboard/components/Overview/BodyFatCard';
import CaloriesByGoalCard from '@/app/(modules)/dashboard/components/Overview/CaloriesByGoalCard';
import { LOCALE } from '@/app/copy';
import MacrosCard from '@/app/(modules)/dashboard/components/Overview/MacrosCard';
import { PROFILE_SECTION_IDS } from '@/app/(modules)/dashboard/(modules)/_user/constants';
import { ReactNode } from 'react';
import Section from '@/app/components/layout/Section';
import SetupTargets from '@/app/(modules)/dashboard/components/Overview/SetupTargets';
import SummaryTiles from '@/app/(modules)/dashboard/components/Overview/SummaryTiles';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

const PAIRED_GRID_CLASS =
  'grid items-start gap-4 md:grid-cols-[repeat(auto-fit,minmax(380px,1fr))]';

interface IProps {
  /** Goes between Today's summary and Nutrition, e.g. the Draft meal plan. */
  afterSummary?: ReactNode;
}

/**
 * Today's summary, Nutrition and Body, live from the User's Profile. Until
 * there is a BMI (height and weight), the setup steps and empty tiles instead.
 */
const Overview = ({ afterSummary }: IProps) => {
  const { user } = useUserContext();
  const { dashboard } = useDictionary();
  const labels = dashboard.bodyMetrics;
  const { macroPlan, pick } = useTargets();

  const dateOfBirth = user.personalInformation?.dateOfBirth;
  const metrics = useBodyMetrics();
  const { bmi, bodyFat, calories, macros, missing } = metrics;
  const plan = macros?.plans.find((option) => option.plan === macroPlan);

  const profileHref = (sectionId: string) => `/dashboard/profile#${sectionId}`;
  const bodyStatsHref = profileHref(PROFILE_SECTION_IDS.bodyStats);
  const personalInformationHref = profileHref(
    PROFILE_SECTION_IDS.personalInformation,
  );

  if (!bmi) {
    return (
      <>
        <SetupTargets
          bodyStats={user.bodyStats}
          dateOfBirth={dateOfBirth}
          bodyStatsHref={bodyStatsHref}
          personalInformationHref={personalInformationHref}
        />
        <Section
          id="summary"
          title={dashboard.summary.title}
          description={dashboard.summary.pending}
        >
          <SummaryTiles metrics={metrics} locale={LOCALE} />
        </Section>
        {afterSummary}
      </>
    );
  }

  const onlyDateOfBirthMissing =
    !calories &&
    !missing.some((field) => field === 'sex' || field === 'activityLevel');
  const caloriesMissing = (card: {
    empty: string;
    dateOfBirthMissing: string;
  }) =>
    onlyDateOfBirthMissing
      ? {
          message: card.dateOfBirthMissing,
          linkLabel: labels.addDateOfBirth,
          href: personalInformationHref,
        }
      : {
          message: card.empty,
          linkLabel: labels.addBodyStats,
          href: bodyStatsHref,
        };

  return (
    <>
      <Section
        id="summary"
        title={dashboard.summary.title}
        description={dashboard.summary.description}
      >
        <SummaryTiles metrics={metrics} plan={plan} locale={LOCALE} />
      </Section>
      {afterSummary}
      <Section
        id="nutrition"
        title={dashboard.nutrition.title}
        description={dashboard.nutrition.description}
      >
        <div className={PAIRED_GRID_CLASS}>
          <CaloriesByGoalCard
            calories={calories}
            onPick={(calorieTarget) => pick({ calorieTarget })}
            missing={caloriesMissing(labels.calories)}
            locale={LOCALE}
          />
          <MacrosCard
            macros={macros}
            calories={calories}
            plan={plan}
            onPlanChange={(macroPlan) => pick({ macroPlan })}
            missing={caloriesMissing(labels.macros)}
            locale={LOCALE}
          />
        </div>
      </Section>
      <Section
        id="body"
        title={dashboard.body.title}
        description={dashboard.body.description}
      >
        <div className={PAIRED_GRID_CLASS}>
          <BmiCard bmi={bmi} locale={LOCALE} />
          <BodyFatCard
            bodyFat={bodyFat}
            sex={user.bodyStats?.sex}
            inputsMissing={missing.some((field) =>
              BODY_FAT_FIELDS.includes(field),
            )}
            locale={LOCALE}
            bodyStatsHref={bodyStatsHref}
          />
        </div>
      </Section>
    </>
  );
};

export default Overview;
