import {
  IUser,
  IUserChange,
} from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { TSocialProfilesSchema } from '@/app/(modules)/dashboard/(modules)/profile/validations';

export const addHttps = (url: string) => {
  if (!url) return '';
  if (!url.includes('https://')) return `https://${url}`;
  return url;
};

export const toSocialProfilesFormValues = (
  user: IUser,
): TSocialProfilesSchema => ({
  facebook: user.socialProfiles?.facebook ?? '',
  twitter: user.socialProfiles?.twitter ?? '',
  instagram: user.socialProfiles?.instagram ?? '',
  linkedin: user.socialProfiles?.linkedin ?? '',
});

export const toSocialProfilesChange = (
  socialProfiles: TSocialProfilesSchema,
): IUserChange => ({ socialProfiles });
