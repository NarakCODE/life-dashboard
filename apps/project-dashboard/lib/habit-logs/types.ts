export interface HabitLog {
  id: string
  workspaceId?: string | null
  habitId: string
  userId: string
  loggedDate: string
  count: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface HabitLogsQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
  habitId?: string
  startDate?: string
  endDate?: string
}

export interface HabitLogsPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface HabitLogsResponseData {
  logs: HabitLog[]
  pagination: HabitLogsPagination
}

export interface HabitLogsResponse {
  data: HabitLogsResponseData
  meta: Record<string, unknown>
}

export interface CreateHabitLogInput {
  habitId: string
  loggedDate: string
  count?: number
  notes?: string
}

export interface UpdateHabitLogInput {
  loggedDate?: string
  count?: number
  notes?: string
}
