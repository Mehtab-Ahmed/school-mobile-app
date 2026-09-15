import { QueryClient } from '@tanstack/react-query';

/** One cache for the whole app, so signing out can wipe everything the last person loaded. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
