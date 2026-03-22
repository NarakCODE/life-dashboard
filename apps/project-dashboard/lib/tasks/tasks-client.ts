import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client"
import type {
  CreateTaskInput,
  MyTasksQuery,
  MyTasksResponse,
  MyTasksResponseMeta,
  UpdateTaskInput,
} from "@/lib/tasks/types"

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
  const payload = await apiRequestEnvelope<MyTasksResponse["data"], MyTasksResponseMeta>({
    path: `/tasks/my-tasks${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })

  return {
    data: payload.data,
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
