import { apiRequest } from "@/lib/api/api-client"
import type {
  PerformanceDashboardResponse,
  PerformanceQuery,
  PerformanceFilters,
} from "@/lib/performance/types"

function buildQueryString(query: PerformanceQuery) {
  const params = new URLSearchParams()

  if (query.startDate) {
    params.set("startDate", query.startDate)
  }

  if (query.endDate) {
    params.set("endDate", query.endDate)
  }

  if (query.projectId && query.projectId !== "all") {
    params.set("projectId", query.projectId)
  }

  if (query.member && query.member !== "all") {
    params.set("member", query.member)
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

/**
 * Get performance dashboard data
 */
export async function getPerformanceDashboard(
  workspaceId: string,
  query: PerformanceQuery,
): Promise<PerformanceDashboardResponse> {
  return apiRequest<PerformanceDashboardResponse>({
    path: `/performance${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })
}

/**
 * Get available filters for performance dashboard
 */
export async function getPerformanceFilters(
  workspaceId: string,
): Promise<PerformanceFilters> {
  return apiRequest<PerformanceFilters>({
    path: "/filters/performance",
    auth: "required",
    workspaceId,
  })
}
