import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { ApiError } from "@/lib/api/api-client"
import type { TaskOverview } from "./dashboard-types"
import { getTaskOverview } from "./dashboard-client"

// ============================================================================
// Query Key Factory
// ============================================================================

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
  taskOverview: (workspaceId: string) =>
    [...dashboardKeys.overview(), "tasks", workspaceId] as const,
} as const

// ============================================================================
// Default Configurations
// ============================================================================

const defaultStaleTime = 60 * 1000 // 1 minute - dashboard data changes frequently
const defaultGcTime = 5 * 60 * 1000 // 5 minutes

// ============================================================================
// Query Options Factories (for SSR/prefetching)
// ============================================================================

export const dashboardQueries = {
  taskOverview: (workspaceId: string) => ({
    queryKey: dashboardKeys.taskOverview(workspaceId),
    queryFn: () => getTaskOverview(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
  }),
}

// ============================================================================
// Queries
// ============================================================================

export function useTaskOverviewQuery(
  workspaceId: string,
  options?: Omit<
    UseQueryOptions<TaskOverview, ApiError>,
    "queryKey" | "queryFn" | "enabled"
  >,
) {
  return useQuery({
    ...dashboardQueries.taskOverview(workspaceId),
    ...options,
  })
}

// ============================================================================
// Type Exports
// ============================================================================

export type { TaskOverview }
