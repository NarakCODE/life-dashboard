'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { hasAuthTokens } from '@/lib/auth';
import { queryKeys } from '@/lib/query/query-keys';

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authApi.me,
    enabled: hasAuthTokens(),
    staleTime: 60 * 1000,
  });
}
