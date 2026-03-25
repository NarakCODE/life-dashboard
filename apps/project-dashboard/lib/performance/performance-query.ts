import { useQuery } from "@tanstack/react-query"
import {
  getPerformanceDashboard,
  getPerformanceFilters,
} from "@/lib/performance/performance-client"
import type { PerformanceQuery } from "@/lib/performance/types"

export const performanceKeys = {
  all: ["performance"] as const,
  dashboard: (filters: PerformanceQuery) =>
    [...performanceKeys.all, "dashboard", filters] as const,
  filters: () => [...performanceKeys.all, "filters"] as const,
}

/**
 * Hook to fetch performance dashboard data
 */
export function usePerformanceDashboard(
  workspaceId: string,
  query: PerformanceQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: performanceKeys.dashboard(query),
    queryFn: () => getPerformanceDashboard(workspaceId, query),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes("40")) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to fetch available performance filters
 */
export function usePerformanceFilters(workspaceId: string) {
  return useQuery({
    queryKey: performanceKeys.filters(),
    queryFn: () => getPerformanceFilters(workspaceId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
