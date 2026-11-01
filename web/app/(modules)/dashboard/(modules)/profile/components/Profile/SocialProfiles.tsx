'use client';

import {
  TDictionary,
  useDictionary,
} from '@/app/providers/dictionary-provider';
import {
  TSocialProfilesSchema,
  createSocialProfilesSchema,
} from '@/app/(modules)/dashboard/(modules)/profile/validations';
import {
  addHttps,
  toSocialProfilesChange,
  toSocialProfilesFormValues,
} from '@/app/(modules)/dashboard/(modules)/profile/helpers';

import ProfileSection from '@/app/(modules)/dashboard/(modules)/profile/components/ProfileSection';
import { TProfileField } from '@/app/(modules)/dashboard/(modules)/profile/interfaces';

const createSchema = (dictionary: TDictionary) =>
  createSocialProfilesSchema(dictionary.validation);

const FIELDS: TProfileField<TSocialProfilesSchema>[] = [
  { kind: 'text', name: 'facebook', label: 'Facebook', normalize: addHttps },
  { kind: 'text', name: 'twitter', label: 'Twitter', normalize: addHttps },
  { kind: 'text', name: 'instagram', label: 'Instagram', normalize: addHttps },
  { kind: 'text', name: 'linkedin', label: 'LinkedIn', normalize: addHttps },
];

const SocialProfiles = () => {
  const { profile } = useDictionary();

  return (
    <ProfileSection<TSocialProfilesSchema>
      title={profile.socialProfiles.title}
      description={profile.socialProfiles.description}
      editLabel={profile.socialProfiles.edit}
      createSchema={createSchema}
      toFormValues={toSocialProfilesFormValues}
      toChange={toSocialProfilesChange}
      fields={FIELDS}
    />
  );
};

export default SocialProfiles;
