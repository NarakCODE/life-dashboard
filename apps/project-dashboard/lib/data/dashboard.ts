import { apiRequest } from "@/lib/api/api-client"

export interface DashboardStats {
  totalTasks: number
  countsByStatus: {
    todo: number
    in_progress: number
    done: number
    archived: number
  }
  overdueCount: number
  upcomingCount: number
  completedSummary: {
    total: number
    latest: string | null
  }
}

export function getDashboardStatsQueryKey(workspaceId: string) {
  return ["workspace", workspaceId, "dashboard", "stats"] as const
}

export async function getDashboardStats(
  workspaceId: string,
): Promise<DashboardStats> {
  return apiRequest<DashboardStats>({
    path: "/dashboard/tasks-overview",
    auth: "required",
    workspaceId,
  })
}
