import type { ProjectTask } from "@/lib/data/project-details"

export interface TaskFilterCounts {
  status?: Record<string, number>
  priority?: Record<string, number>
  tags?: Record<string, number>
  members?: Record<string, number>
}

export interface TaskPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface MyTasksResponseData {
  tasks: ProjectTask[]
  pagination: TaskPagination
}

export interface MyTasksResponseMeta {
  filterCounts: TaskFilterCounts
}

export interface MyTasksResponse {
  data: MyTasksResponseData
  meta: MyTasksResponseMeta
}

export interface MyTasksQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
  status?: string[]
  priority?: string
  tags?: string[]
  assigneeIds?: string[]
  projectId?: string
  startDateFrom?: string
  startDateTo?: string
  view?: "list" | "board" | "timeline"
  groupBy?: "none" | "status" | "assignee" | "tags"
}

export interface CreateTaskInput {
  name: string
  projectId: string
  workstreamId?: string
  assigneeId?: string
  description?: string
  status?: "todo" | "in-progress" | "done"
  priority?: "no-priority" | "low" | "medium" | "high" | "urgent"
  tag?: string
  startDate?: string
  dueDate?: string
}

export interface UpdateTaskInput {
  name?: string
  projectId?: string
  workstreamId?: string
  assigneeId?: string
  description?: string
  status?: "todo" | "in-progress" | "done"
  priority?: "no-priority" | "low" | "medium" | "high" | "urgent"
  tag?: string
  startDate?: string
  dueDate?: string
}
