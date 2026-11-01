import { afterEach, describe, expect, it } from 'vitest';
import {
  toPersonalInfoChange,
  toPersonalInfoFormValues,
} from './personal-information.helpers';

import { IUser } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { TDictionary } from '@/app/providers/dictionary-provider';
import { createPersonalInformationSchema } from '@/app/(modules)/dashboard/(modules)/profile/validations';
import { copy as en } from '@/app/copy';

const originalTimeZone = process.env.TZ;

describe('date of birth', () => {
  afterEach(() => {
    process.env.TZ = originalTimeZone;
  });

  it.each([
    'UTC',
    'Europe/Budapest',
    'America/Los_Angeles',
    'Pacific/Auckland',
  ])('survives User → form → change unchanged in %s', (timeZone) => {
    process.env.TZ = timeZone;
    const user: IUser = {
      id: 'user-sub',
      email: 'a@b.c',
      personalInformation: { dateOfBirth: '1990-05-15' },
    };

    const formValues = toPersonalInfoFormValues(user);
    const change = toPersonalInfoChange(formValues);

    expect(formValues.dateOfBirth?.getDate()).toBe(15);
    expect(change.personalInformation?.dateOfBirth).toBe(
      '1990-05-15T12:00:00.000Z',
    );
  });
});

describe('date of birth age limits', () => {
  const today = new Date(2025, 5, 15);
  const schema = createPersonalInformationSchema(en as TDictionary, today);
  const parse = (dateOfBirth?: Date) =>
    schema.safeParse({
      userName: '',
      firstName: '',
      lastName: '',
      dateOfBirth,
    });

  it.each([
    ['18 today', new Date(2007, 5, 15)],
    ['100 until tomorrow', new Date(1924, 5, 16)],
    ['unset', undefined],
  ])('accepts a User who is %s', (_, dateOfBirth) => {
    expect(parse(dateOfBirth).success).toBe(true);
  });

  it('accepts an emptied phone number', () => {
    expect(
      schema.safeParse({
        userName: '',
        firstName: '',
        lastName: '',
        phoneNumber: null,
      }).success,
    ).toBe(true);
  });

  it.each([
    ['18 tomorrow', new Date(2007, 5, 16)],
    ['101 today', new Date(1924, 5, 15)],
  ])('rejects a User who is %s', (_, dateOfBirth) => {
    const result = parse(dateOfBirth);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'You must be between 18 and 100 years old',
    );
  });
});
