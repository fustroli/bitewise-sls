'use client';

import Link from 'next/link';
import { PROFILE_ROUTE } from '@/app/(modules)/dashboard/constants';
import UserAvatar from '@/app/(modules)/dashboard/(modules)/_user/components/UserAvatar';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

/** The phone app bar's avatar, linking to the Account page. */
const UserMenuLink = () => {
  const { user } = useUserContext();
  const label = useDictionary().dashboard.sidebar.account;

  return (
    <Link
      href={`/dashboard${PROFILE_ROUTE}`}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <UserAvatar user={user} className="size-[34px] rounded-full text-sm" />
    </Link>
  );
};

export default UserMenuLink;
