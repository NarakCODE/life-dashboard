import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { ApiError } from "@/lib/api/api-client"
import type { HealthCheckResult } from "./health-types"
import { checkHealth } from "./health-client"

// ============================================================================
// Query Key Factory
// ============================================================================

export const healthKeys = {
  all: ["health"] as const,
  check: () => [...healthKeys.all, "check"] as const,
} as const

// ============================================================================
// Default Configurations
// ============================================================================

const defaultStaleTime = 30 * 1000 // 30 seconds - health status changes quickly
const defaultGcTime = 60 * 1000 // 1 minute

// ============================================================================
// Query Options Factories (for SSR/prefetching)
// ============================================================================

export const healthQueries = {
  check: () => ({
    queryKey: healthKeys.check(),
    queryFn: checkHealth,
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
    retry: false, // Don't retry health checks - fail fast
  }),
}

// ============================================================================
// Queries
// ============================================================================

export function useHealthCheckQuery(
  options?: Omit<
    UseQueryOptions<HealthCheckResult, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...healthQueries.check(),
    ...options,
  })
}

// ============================================================================
// Type Exports
// ============================================================================

export type { HealthCheckResult }
