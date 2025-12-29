'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * React Query Provider wrapper component
 * Sets up QueryClient with optimal configuration for the application
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Equivalent to SWR's revalidateOnFocus
            refetchOnWindowFocus: true,
            // Equivalent to SWR's revalidateOnReconnect
            refetchOnReconnect: true,
            // Equivalent to SWR's dedupingInterval
            staleTime: 2000,
            // Retry on failure
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
