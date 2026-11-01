import { PropsWithChildren, useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryKey,
} from '@tanstack/react-query';

interface IProps extends PropsWithChildren {
  /** Queries that start out loaded, e.g. `[['me'], user]`. */
  seed?: [QueryKey, unknown][];
  /** To inspect the cache; from `createTestQueryClient()`. */
  client?: QueryClient;
}

/** A query cache that never refetches or retries on its own. */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });

/** For tests: a fresh query cache, optionally seeded. */
export function TestQueryProvider({
  seed = [],
  client: given,
  children,
}: IProps) {
  const [client] = useState(() => {
    const queryClient = given ?? createTestQueryClient();
    seed.forEach(([key, data]) => queryClient.setQueryData(key, data));
    return queryClient;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
