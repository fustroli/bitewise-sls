'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';

import { IUser } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { avatarInitials } from '@/app/(modules)/dashboard/(modules)/_user/helpers';

interface IUserAvatarProps {
  user: Pick<IUser, 'email' | 'personalInformation' | 'avatarUrl'>;
  className?: string;
}

/** The User's avatar, or their initials on a coloured background without one. */
const UserAvatar = ({ user, className }: IUserAvatarProps) => (
  <Avatar className={className}>
    <AvatarImage src={user.avatarUrl} alt="" />
    {/* Inherits the Avatar's corners, so a square Avatar keeps them. */}
    <AvatarFallback className="rounded-[inherit] bg-primary font-medium text-primary-foreground">
      {avatarInitials(user)}
    </AvatarFallback>
  </Avatar>
);

export default UserAvatar;
