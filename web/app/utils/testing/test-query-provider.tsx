import { PropsWithChildren, useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryKey,
} from '@tanstack/react-query';

interface IProps extends PropsWithChildren {
  /** Queries that start out loaded, e.g. `[['me'], user]`. */
  seed?: [QueryKey, unknown][];
}

/** For tests: a fresh query cache that never refetches or retries. */
export function TestQueryProvider({ seed = [], children }: IProps) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    seed.forEach(([key, data]) => queryClient.setQueryData(key, data));
    return queryClient;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
