import {
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  Leaf,
  Scale,
  Utensils,
} from 'lucide-react';

import { INavItem } from '@/app/(modules)/dashboard/interfaces';

export const WEEK_PLAN_ROUTE = '/week';

/** Dashboard and the library: the sidebar's first group, the first tabs. */
export const LIBRARY_NAV_ITEMS: INavItem[] = [
  { label: 'dashboard', mobileLabel: 'home', route: '', icon: LayoutGrid },
  {
    label: 'ingredients',
    mobileLabel: 'ingredients',
    route: '/ingredients',
    icon: Leaf,
  },
  { label: 'meals', mobileLabel: 'meals', route: '/meals', icon: Utensils },
];

/** Opens the sidebar's second group, after a divider. */
export const MEAL_PLANS_NAV_ITEM: INavItem = {
  label: 'mealPlans',
  mobileLabel: 'plans',
  route: '/meal-plans',
  icon: CalendarDays,
  // Its tab leads to the Week plan too, through a switch.
  phoneRoutes: [WEEK_PLAN_ROUTE],
};

/** After Meal plans in the sidebar; behind the Plans tab on a phone. */
export const WEEK_PLAN_NAV_ITEM: INavItem = {
  label: 'weekPlan',
  mobileLabel: 'weekPlan',
  route: WEEK_PLAN_ROUTE,
  icon: CalendarRange,
};

/** Last in the sidebar's second group, the last tab on a phone. */
export const COMPARE_NAV_ITEM: INavItem = {
  label: 'compare',
  mobileLabel: 'compare',
  route: '/compare',
  icon: Scale,
};

export const PROFILE_ROUTE = '/profile';
