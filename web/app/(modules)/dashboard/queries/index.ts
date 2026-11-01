import { api, unwrap } from '@/app/lib/api';

import { ILibraryCounts } from '@/app/(modules)/dashboard/interfaces';
import { QUERY_KEYS } from '@/app/(modules)/dashboard/(modules)/_resource-table/constants';
import { queryOptions } from '@tanstack/react-query';

/** How many Ingredients, Meals and Meal plans the User has, in one call. */
export const statisticsQuery = queryOptions({
  queryKey: QUERY_KEYS.statistics,
  queryFn: async () => unwrap(await api<ILibraryCounts>('users/me/statistics')),
});
