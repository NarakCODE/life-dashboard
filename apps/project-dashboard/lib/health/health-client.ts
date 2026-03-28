import { apiRequestEnvelope } from "@/lib/api/api-client"
import type { HealthCheckResult } from "./health-types"

// Handle double-wrapped API response: { success: true, data: { success: true, data: [...] } }
interface DoubleWrappedResponse<T> {
  success: boolean
  data: T
}

export async function checkHealth(): Promise<HealthCheckResult> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<HealthCheckResult>>({
    path: "/health",
    method: "GET",
    auth: "none",
  })
  return response.data.data ?? response.data
}
