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

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>({
    path: "/dashboard/tasks-overview",
    auth: "required",
  })
}
