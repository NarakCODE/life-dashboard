export interface TaskOverviewCountsByStatus {
  todo: number
  in_progress: number
  done: number
  archived: number
}

export interface TaskOverviewCompletedSummary {
  total: number
  latest: string | null
}

export interface TaskOverview {
  totalTasks: number
  countsByStatus: TaskOverviewCountsByStatus
  overdueCount: number
  upcomingCount: number
  completedSummary: TaskOverviewCompletedSummary
}
