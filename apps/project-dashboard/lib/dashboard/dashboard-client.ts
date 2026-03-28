import { apiRequestEnvelope } from "@/lib/api/api-client"
import type { TaskOverview } from "./dashboard-types"

// Handle double-wrapped API response: { success: true, data: { success: true, data: [...] } }
interface DoubleWrappedResponse<T> {
  success: boolean
  data: T
}

export async function getTaskOverview(workspaceId: string): Promise<TaskOverview> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<TaskOverview>>({
    path: "/dashboard/tasks-overview",
    method: "GET",
    auth: "required",
    workspaceId,
  })
  return response.data.data ?? response.data
}
