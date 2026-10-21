import { api, unwrap } from '@/app/lib/api';

import { ILibraryCounts } from '@/app/(modules)/dashboard/interfaces';
import { queryOptions } from '@tanstack/react-query';

export const STATISTICS_KEY = ['statistics'] as const;

/** How many Ingredients, Meals and Meal plans the User has, in one call. */
export const statisticsQuery = queryOptions({
  queryKey: STATISTICS_KEY,
  queryFn: async () => unwrap(await api<ILibraryCounts>('users/me/statistics')),
});
