'use client';

import { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Long enough that moving between pages reuses what was just loaded; writes
// invalidate what they change.
const STALE_TIME_MS = 60_000;

/**
 * The query cache. One per mount, so leaving the dashboard (signing out)
 * drops everything cached for the User.
 */
export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: STALE_TIME_MS, retry: 1 },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
