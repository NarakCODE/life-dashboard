import { apiRequestEnvelope } from "@/lib/api/api-client"
import type { PerformanceFiltersResponse } from "./filters-types"

// Handle double-wrapped API response: { success: true, data: { success: true, data: [...] } }
interface DoubleWrappedResponse<T> {
  success: boolean
  data: T
}

export async function getPerformanceFilters(): Promise<PerformanceFiltersResponse> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<PerformanceFiltersResponse>>({
    path: "/filters/performance",
    method: "GET",
    auth: "required",
  })
  return response.data.data ?? response.data
}
