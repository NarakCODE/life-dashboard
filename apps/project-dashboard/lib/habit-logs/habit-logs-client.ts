import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client"
import type {
  CreateHabitLogInput,
  HabitLog,
  HabitLogsQuery,
  HabitLogsResponse,
  UpdateHabitLogInput,
} from "@/lib/habit-logs/types"

interface HabitLogsListPayload {
  items: HabitLog[]
  total: number
}

function buildQueryString(query: HabitLogsQuery) {
  const params = new URLSearchParams()

  const entries = Object.entries(query) as Array<
    [keyof HabitLogsQuery, HabitLogsQuery[keyof HabitLogsQuery]]
  >

  for (const [key, value] of entries) {
    if (value === undefined || value === null || value === "") continue
    params.set(key, String(value))
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

function toPaginatedResponse(
  payload: HabitLogsListPayload,
  query: HabitLogsQuery,
): HabitLogsResponse {
  const page = query.page ?? 1
  const limit = query.limit ?? 20

  return {
    data: {
      logs: payload.items,
      pagination: {
        total: payload.total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(payload.total / limit)),
      },
    },
    meta: {},
  }
}

export async function getHabitLogs(
  workspaceId: string,
  query: HabitLogsQuery,
): Promise<HabitLogsResponse> {
  const payload = await apiRequestEnvelope<HabitLogsListPayload>({
    path: `/habit-logs${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })

  return toPaginatedResponse(payload.data, query)
}

export async function getHabitLogsByHabit(
  workspaceId: string,
  habitId: string,
  query: Omit<HabitLogsQuery, "habitId">,
): Promise<HabitLogsResponse> {
  const payload = await apiRequestEnvelope<HabitLogsListPayload>({
    path: `/habit-logs/habit/${habitId}${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })

  return toPaginatedResponse(payload.data, query)
}

export async function getHabitLog(
  workspaceId: string,
  habitLogId: string,
): Promise<HabitLog> {
  return apiRequest<HabitLog>({
    path: `/habit-logs/${habitLogId}`,
    auth: "required",
    workspaceId,
  })
}

export async function createHabitLog(
  workspaceId: string,
  input: CreateHabitLogInput,
): Promise<HabitLog> {
  return apiRequest<HabitLog>({
    path: "/habit-logs",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function updateHabitLog(
  workspaceId: string,
  habitLogId: string,
  input: UpdateHabitLogInput,
): Promise<HabitLog> {
  return apiRequest<HabitLog>({
    path: `/habit-logs/${habitLogId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function deleteHabitLog(workspaceId: string, habitLogId: string) {
  return apiRequest<void>({
    path: `/habit-logs/${habitLogId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  })
}
