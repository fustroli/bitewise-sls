'use client';

import {
  EActivityLevel,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';
import {
  TBodyStatsSchema,
  createBodyStatsSchema,
} from '@/app/(modules)/dashboard/(modules)/profile/validations';
import {
  toBodyStatsChange,
  toBodyStatsFormValues,
} from '@/app/(modules)/dashboard/(modules)/profile/helpers';

import { BODY_STATS_LIMITS } from '@/app/(modules)/dashboard/(modules)/profile/constants';
import Link from 'next/link';
import { PROFILE_SECTION_IDS } from '@/app/(modules)/dashboard/(modules)/_user/constants';
import ProfileSection from '@/app/(modules)/dashboard/(modules)/profile/components/ProfileSection';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

const CM = 'cm';
const KG = 'kg';

const BodyStats = () => {
  const { profile } = useDictionary();
  const labels = profile.bodyStats;
  const { user } = useUserContext();
  const isWoman = user.bodyStats?.sex === ESex.FEMALE;

  return (
    <ProfileSection<TBodyStatsSchema>
      id={PROFILE_SECTION_IDS.bodyStats}
      title={labels.title}
      description={labels.description}
      aside={
        <Link
          href="/dashboard"
          className="text-sm font-bold text-primary hover:underline"
        >
          {labels.viewDashboard}
        </Link>
      }
      editLabel={labels.edit}
      createSchema={createBodyStatsSchema}
      toFormValues={toBodyStatsFormValues}
      toChange={toBodyStatsChange}
      fields={[
        {
          kind: 'select',
          name: 'sex',
          group: labels.basics,
          label: labels.sex,
          placeholder: labels.select,
          clearLabel: labels.notSet,
          options: Object.values(ESex).map((sex) => ({
            value: sex,
            label: labels.sexes[sex],
          })),
        },
        {
          kind: 'number',
          name: 'heightCm',
          group: labels.basics,
          label: labels.height,
          unit: CM,
          ...BODY_STATS_LIMITS.heightCm,
        },
        {
          kind: 'number',
          name: 'weightKg',
          group: labels.basics,
          label: labels.weight,
          unit: KG,
          ...BODY_STATS_LIMITS.weightKg,
        },
        {
          kind: 'select',
          name: 'activityLevel',
          group: labels.basics,
          label: labels.activityLevel,
          placeholder: labels.select,
          clearLabel: labels.notSet,
          options: Object.values(EActivityLevel).map((level) => ({
            value: level,
            label: labels.activityLevels[level],
          })),
        },
        {
          kind: 'number',
          name: 'neckCm',
          group: labels.measurements,
          label: labels.neck,
          unit: CM,
          ...BODY_STATS_LIMITS.neckCm,
        },
        {
          kind: 'number',
          name: 'waistCm',
          group: labels.measurements,
          label: labels.waist,
          unit: CM,
          ...BODY_STATS_LIMITS.waistCm,
        },
        {
          kind: 'number',
          name: 'hipCm',
          group: labels.measurements,
          label: labels.hip,
          unit: CM,
          hint: labels.hipHint,
          emptyText: isWoman ? undefined : labels.womenOnly,
          ...BODY_STATS_LIMITS.hipCm,
        },
      ]}
    />
  );
};

export default BodyStats;
