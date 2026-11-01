'use client';

import {
  TDictionary,
  useDictionary,
} from '@/app/providers/dictionary-provider';
import {
  TPersonalInfoSchema,
  createPersonalInformationSchema,
} from '@/app/(modules)/dashboard/(modules)/profile/validations';
import {
  toPersonalInfoChange,
  toPersonalInfoFormValues,
} from '@/app/(modules)/dashboard/(modules)/profile/helpers';

import { PROFILE_SECTION_IDS } from '@/app/(modules)/dashboard/(modules)/_user/constants';
import ProfileSection from '@/app/(modules)/dashboard/(modules)/profile/components/ProfileSection';

const createSchema = (dictionary: TDictionary) =>
  createPersonalInformationSchema(dictionary);

const PersonalInformation = () => {
  const { profile } = useDictionary();
  const labels = profile.personalInformation;

  return (
    <ProfileSection<TPersonalInfoSchema>
      id={PROFILE_SECTION_IDS.personalInformation}
      title={labels.title}
      description={labels.description}
      editLabel={labels.edit}
      createSchema={createSchema}
      toFormValues={toPersonalInfoFormValues}
      toChange={toPersonalInfoChange}
      fields={[
        { kind: 'text', name: 'firstName', label: labels.firstName },
        { kind: 'text', name: 'lastName', label: labels.lastName },
        { kind: 'text', name: 'userName', label: labels.username },
        { kind: 'phone', name: 'phoneNumber', label: labels.phoneNumber },
        { kind: 'date', name: 'dateOfBirth', label: labels.dob },
      ]}
    />
  );
};

export default PersonalInformation;
