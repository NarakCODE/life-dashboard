import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createHabitLog,
  deleteHabitLog,
  getHabitLog,
  getHabitLogs,
  getHabitLogsByHabit,
  updateHabitLog,
} from "@/lib/habit-logs/habit-logs-client"
import type {
  CreateHabitLogInput,
  HabitLogsQuery,
  UpdateHabitLogInput,
} from "@/lib/habit-logs/types"

export const habitLogKeys = {
  all: (workspaceId: string) => ["workspace", workspaceId, "habit-logs"] as const,
  list: (workspaceId: string, query: HabitLogsQuery) =>
    [...habitLogKeys.all(workspaceId), "list", query] as const,
  byHabit: (
    workspaceId: string,
    habitId: string,
    query: Omit<HabitLogsQuery, "habitId">,
  ) => [...habitLogKeys.all(workspaceId), "by-habit", habitId, query] as const,
  detail: (workspaceId: string, habitLogId: string) =>
    [...habitLogKeys.all(workspaceId), "detail", habitLogId] as const,
}

export function useHabitLogsQuery(
  workspaceId: string,
  query: HabitLogsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: habitLogKeys.list(workspaceId, query),
    queryFn: () => getHabitLogs(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
  })
}

export function useHabitLogsByHabitQuery(
  workspaceId: string,
  habitId: string,
  query: Omit<HabitLogsQuery, "habitId">,
  enabled = true,
) {
  return useQuery({
    queryKey: habitLogKeys.byHabit(workspaceId, habitId, query),
    queryFn: () => getHabitLogsByHabit(workspaceId, habitId, query),
    enabled: enabled && Boolean(workspaceId) && Boolean(habitId),
  })
}

export function useHabitLogQuery(
  workspaceId: string,
  habitLogId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: habitLogKeys.detail(workspaceId, habitLogId),
    queryFn: () => getHabitLog(workspaceId, habitLogId),
    enabled: enabled && Boolean(workspaceId) && Boolean(habitLogId),
  })
}

export function useCreateHabitLogMutation(
  workspaceId: string,
  queryToInvalidate?: HabitLogsQuery,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateHabitLogInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return createHabitLog(workspaceId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: habitLogKeys.all(workspaceId) })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: habitLogKeys.list(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}

export function useUpdateHabitLogMutation(
  workspaceId: string,
  queryToInvalidate?: HabitLogsQuery,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      habitLogId,
      input,
    }: {
      habitLogId: string
      input: UpdateHabitLogInput
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return updateHabitLog(workspaceId, habitLogId, input)
    },
    onSuccess: async (_data, { habitLogId }) => {
      await queryClient.invalidateQueries({ queryKey: habitLogKeys.all(workspaceId) })
      await queryClient.invalidateQueries({
        queryKey: habitLogKeys.detail(workspaceId, habitLogId),
      })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: habitLogKeys.list(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}

export function useDeleteHabitLogMutation(
  workspaceId: string,
  queryToInvalidate?: HabitLogsQuery,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (habitLogId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return deleteHabitLog(workspaceId, habitLogId)
    },
    onSuccess: async (_data, habitLogId) => {
      await queryClient.invalidateQueries({ queryKey: habitLogKeys.all(workspaceId) })
      await queryClient.removeQueries({
        queryKey: habitLogKeys.detail(workspaceId, habitLogId),
      })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: habitLogKeys.list(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}
