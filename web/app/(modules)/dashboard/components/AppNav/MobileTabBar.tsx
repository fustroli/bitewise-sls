'use client';

import {
  COMPARE_NAV_ITEM,
  LIBRARY_NAV_ITEMS,
  MEAL_PLANS_NAV_ITEM,
} from '@/app/(modules)/dashboard/constants';

import Link from 'next/link';
import { cn } from '@/app/lib';
import { isNavItemActive } from '@/app/(modules)/dashboard/components/AppNav/nav.helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { usePathname } from 'next/navigation';

const TABS = [...LIBRARY_NAV_ITEMS, MEAL_PLANS_NAV_ITEM, COMPARE_NAV_ITEM];

/** The fixed bottom tab bar below `md`. */
const MobileTabBar = () => {
  const pathname = usePathname();
  const labels = useDictionary().dashboard.sidebar;
  const base = `/dashboard`;

  return (
    <nav
      aria-label={labels.mainNavigation}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 md:hidden"
    >
      <ul className="flex">
        {TABS.map((item) => {
          const href = `${base}${item.route}`;
          const isActive = [item.route, ...(item.phoneRoutes ?? [])].some(
            (route) => isNavItemActive(pathname, `${base}${route}`, route),
          );

          return (
            <li key={item.route} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  isActive
                    ? 'font-extrabold text-accent-foreground'
                    : 'font-bold text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-[52px] items-center justify-center rounded-full',
                    isActive && 'bg-accent',
                  )}
                >
                  <item.icon aria-hidden className="size-5" />
                </span>
                {labels[item.mobileLabel]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileTabBar;
