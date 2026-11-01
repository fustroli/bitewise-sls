import { QueryClient, QueryKey } from '@tanstack/react-query';

/** Marks every query under these key prefixes stale; shown ones refetch. */
export const invalidateAll = (queryClient: QueryClient, keys: QueryKey[]) =>
  Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
