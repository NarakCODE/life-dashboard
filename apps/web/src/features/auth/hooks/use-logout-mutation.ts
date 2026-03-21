'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { clearTokens } from '@/lib/auth';
import { queryKeys } from '@/lib/query/query-keys';

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      clearTokens();
      await queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    },
  });
}
