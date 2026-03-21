'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/query-keys';

export function useTaskOverviewQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.taskOverview(),
    queryFn: dashboardApi.getTaskOverview,
    enabled,
    staleTime: 60 * 1000,
  });
}
