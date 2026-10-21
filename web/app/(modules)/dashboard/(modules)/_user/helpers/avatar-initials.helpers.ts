import { IUser } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';

const INITIALS_LENGTH = 2;

/**
 * The first two characters of the User's username, in capitals, shown when
 * there's no avatar; the email's local part stands in for an unset username.
 */
export const avatarInitials = (
  user: Pick<IUser, 'email' | 'personalInformation'>,
): string => {
  const name =
    user.personalInformation?.userName?.trim() || user.email.split('@')[0];

  return Array.from(name).slice(0, INITIALS_LENGTH).join('').toUpperCase();
};
