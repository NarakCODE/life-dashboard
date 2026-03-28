import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { ApiError } from "@/lib/api/api-client"
import type { FilterMember, FilterProject, PerformanceFiltersResponse } from "./filters-types"
import { getPerformanceFilters } from "./filters-client"

// ============================================================================
// Query Key Factory
// ============================================================================

export const filtersKeys = {
  all: ["filters"] as const,
  performance: () => [...filtersKeys.all, "performance"] as const,
} as const

// ============================================================================
// Default Configurations
// ============================================================================

const defaultStaleTime = 5 * 60 * 1000 // 5 minutes - filter options don't change often
const defaultGcTime = 10 * 60 * 1000 // 10 minutes

// ============================================================================
// Query Options Factories (for SSR/prefetching)
// ============================================================================

export const filtersQueries = {
  performance: () => ({
    queryKey: filtersKeys.performance(),
    queryFn: getPerformanceFilters,
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
  }),
}

// ============================================================================
// Queries
// ============================================================================

export function usePerformanceFiltersQuery(
  options?: Omit<
    UseQueryOptions<PerformanceFiltersResponse, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...filtersQueries.performance(),
    ...options,
  })
}

// ============================================================================
// Type Exports
// ============================================================================

export type { PerformanceFiltersResponse, FilterProject, FilterMember }
