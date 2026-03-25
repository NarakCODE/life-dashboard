import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client"
import type { ProjectTask } from "@/lib/data/project-details"
import type {
  CreateTaskInput,
  MyTasksQuery,
  MyTasksResponse,
  MyTasksResponseMeta,
  UpdateTaskInput,
} from "@/lib/tasks/types"

/**
 * Backend TaskResponseDto structure
 */
interface BackendTask {
  id: string
  workspaceId: string
  name: string
  status: "todo" | "in-progress" | "done" | "archived"
  projectId: string
  projectName: string
  workstreamId?: string
  workstreamName?: string
  assignee?: {
    id: string
    name: string
    avatarUrl?: string
    role?: string
  }
  startDate?: string
  priority?: "no-priority" | "low" | "medium" | "high" | "urgent"
  tag?: string
  description?: string
  dueDate?: string
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Transform backend TaskResponseDto to frontend ProjectTask format
 */
function transformTaskToProjectTask(task: BackendTask): ProjectTask {
  return {
    ...task,
    startDate: task.startDate ? new Date(task.startDate) : undefined,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
  } as ProjectTask
}

function buildQueryString(query: MyTasksQuery) {
  const params = new URLSearchParams()

  const entries = Object.entries(query) as Array<[keyof MyTasksQuery, MyTasksQuery[keyof MyTasksQuery]]>

  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","))
      continue
    }

    params.set(key, String(value))
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

export async function getMyTasks(
  workspaceId: string,
  query: MyTasksQuery,
): Promise<MyTasksResponse> {
  const payload = await apiRequestEnvelope<{ tasks: BackendTask[]; pagination: TaskPagination }, MyTasksResponseMeta>({
    path: `/tasks/my-tasks${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })

  return {
    data: {
      tasks: payload.data.tasks.map(transformTaskToProjectTask),
      pagination: payload.data.pagination,
    },
    meta: payload.meta ?? { filterCounts: {} },
  }
}

export async function createTask(workspaceId: string, input: CreateTaskInput) {
  return apiRequest({
    path: "/tasks",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function updateTask(
  workspaceId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  return apiRequest({
    path: `/tasks/${taskId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function deleteTask(workspaceId: string, taskId: string) {
  return apiRequest({
    path: `/tasks/${taskId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  })
}

export async function getAllTasks(
  workspaceId: string,
  query: MyTasksQuery,
): Promise<MyTasksResponse> {
  const payload = await apiRequestEnvelope<{ tasks: BackendTask[]; pagination: TaskPagination }, MyTasksResponseMeta>({
    path: `/tasks${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })

  return {
    data: {
      tasks: payload.data.tasks.map(transformTaskToProjectTask),
      pagination: payload.data.pagination,
    },
    meta: payload.meta ?? { filterCounts: {} },
  }
}

export async function getTask(
  workspaceId: string,
  taskId: string,
): Promise<ProjectTask> {
  const task = await apiRequest<BackendTask>({
    path: `/tasks/${taskId}`,
    auth: "required",
    workspaceId,
  })
  return transformTaskToProjectTask(task)
}

interface TaskPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}
