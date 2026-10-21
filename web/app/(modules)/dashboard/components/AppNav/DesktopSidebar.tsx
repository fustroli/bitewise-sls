'use client';

import {
  COMPARE_NAV_ITEM,
  LIBRARY_NAV_ITEMS,
  MEAL_PLANS_NAV_ITEM,
  PROFILE_ROUTE,
  WEEK_PLAN_NAV_ITEM,
} from '@/app/(modules)/dashboard/constants';

import BrandLogo from '@/app/(modules)/dashboard/components/AppNav/BrandLogo';
import { INavItem } from '@/app/(modules)/dashboard/interfaces';
import Link from 'next/link';
import UserAvatar from '@/app/(modules)/dashboard/(modules)/_user/components/UserAvatar';
import { cn } from '@/app/lib';
import { isNavItemActive } from '@/app/(modules)/dashboard/components/AppNav/nav.helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { usePathname } from 'next/navigation';
import { useUserContext } from '@/app/(modules)/dashboard/(modules)/_user/context';

/**
 * The fixed left sidebar from `md` up: the library, then Meal plans, Week
 * plan and Compare, then the account.
 */
const DesktopSidebar = () => {
  const pathname = usePathname();
  const labels = useDictionary().dashboard.sidebar;
  const { user } = useUserContext();
  const base = `/dashboard`;
  const profileHref = `${base}${PROFILE_ROUTE}`;
  const isProfile = isNavItemActive(pathname, profileHref, PROFILE_ROUTE);

  const renderItem = (item: INavItem) => {
    const href = `${base}${item.route}`;
    const isActive = isNavItemActive(pathname, href, item.route);

    return (
      <li key={item.route}>
        <Link
          href={href}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isActive
              ? 'bg-accent font-bold text-accent-foreground'
              : 'font-semibold text-secondary-foreground hover:bg-muted',
          )}
        >
          <item.icon aria-hidden className="size-[18px]" />
          {labels[item.label]}
        </Link>
      </li>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col gap-8 overflow-y-auto border-r bg-card px-4 py-6 md:flex">
      <BrandLogo href={base} label={labels.homeLink} />
      <nav aria-label={labels.mainNavigation}>
        <ul className="flex flex-col gap-1">
          {LIBRARY_NAV_ITEMS.map(renderItem)}
          {renderItem(MEAL_PLANS_NAV_ITEM)}
          <li aria-hidden className="mx-3 my-2 h-px bg-border" />
          {renderItem(WEEK_PLAN_NAV_ITEM)}
          {renderItem(COMPARE_NAV_ITEM)}
        </ul>
      </nav>
      <Link
        href={profileHref}
        aria-current={isProfile ? 'page' : undefined}
        className={cn(
          'mt-auto flex min-h-[52px] items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isProfile && 'bg-accent text-accent-foreground hover:bg-accent',
        )}
      >
        <UserAvatar user={user} className="size-9 rounded-full text-sm" />
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-bold">{labels.account}</span>
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </span>
      </Link>
    </aside>
  );
};

export default DesktopSidebar;
