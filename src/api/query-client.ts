import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Дані щоденника змінюються рідко й переважно з цього ж пристрою.
      staleTime: 60_000,
      retry: 1,
    },
  },
});
