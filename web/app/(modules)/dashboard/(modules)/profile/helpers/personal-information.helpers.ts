import {
  IUser,
  IUserChange,
} from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { TPersonalInfoSchema } from '@/app/(modules)/dashboard/(modules)/profile/validations';

const NOON = 12;

/**
 * The stored date of birth (`YYYY-MM-DD`, read as UTC) as a local Date on the
 * same calendar day, which is what the DatePicker shows.
 */
export const dateOfBirthToForm = (dateOfBirth?: string) => {
  if (!dateOfBirth) return undefined;

  const date = new Date(dateOfBirth);
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    NOON,
  );
};

/**
 * Noon UTC of the picked day, so no time zone moves it to another day; the
 * API keeps its calendar date.
 */
export const dateOfBirthToUser = (date?: Date) => {
  if (!date) return undefined;

  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), NOON),
  ).toISOString();
};

export const toPersonalInfoFormValues = (user: IUser): TPersonalInfoSchema => {
  const info = user.personalInformation;

  return {
    firstName: info?.firstName ?? '',
    lastName: info?.lastName ?? '',
    userName: info?.userName ?? '',
    phoneNumber: info?.phoneNumber,
    dateOfBirth: dateOfBirthToForm(info?.dateOfBirth),
  };
};

export const toPersonalInfoChange = ({
  phoneNumber,
  dateOfBirth,
  ...values
}: TPersonalInfoSchema): IUserChange => ({
  personalInformation: {
    ...values,
    phoneNumber: phoneNumber ?? '',
    dateOfBirth: dateOfBirthToUser(dateOfBirth),
  },
});
