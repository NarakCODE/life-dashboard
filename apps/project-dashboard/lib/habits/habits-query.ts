import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  archiveHabit,
  createHabit,
  deleteHabit,
  getHabit,
  getHabits,
  updateHabit,
} from "@/lib/habits/habits-client"
import type { CreateHabitInput, HabitsQuery, UpdateHabitInput } from "@/lib/habits/types"

export const habitKeys = {
  all: (workspaceId: string) => ["workspace", workspaceId, "habits"] as const,
  list: (workspaceId: string, query: HabitsQuery) =>
    [...habitKeys.all(workspaceId), "list", query] as const,
  detail: (workspaceId: string, habitId: string) =>
    [...habitKeys.all(workspaceId), "detail", habitId] as const,
}

export function useHabitsQuery(workspaceId: string, query: HabitsQuery, enabled = true) {
  return useQuery({
    queryKey: habitKeys.list(workspaceId, query),
    queryFn: () => getHabits(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
  })
}

export function useHabitQuery(workspaceId: string, habitId: string, enabled = true) {
  return useQuery({
    queryKey: habitKeys.detail(workspaceId, habitId),
    queryFn: () => getHabit(workspaceId, habitId),
    enabled: enabled && Boolean(workspaceId) && Boolean(habitId),
  })
}

export function useCreateHabitMutation(workspaceId: string, queryToInvalidate?: HabitsQuery) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateHabitInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }
      return createHabit(workspaceId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: habitKeys.all(workspaceId) })
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: habitKeys.list(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}

export function useUpdateHabitMutation(workspaceId: string, queryToInvalidate?: HabitsQuery) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, input }: { habitId: string; input: UpdateHabitInput }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }
      return updateHabit(workspaceId, habitId, input)
    },
    onSuccess: async (_data, { habitId }) => {
      await queryClient.invalidateQueries({ queryKey: habitKeys.all(workspaceId) })
      await queryClient.invalidateQueries({ queryKey: habitKeys.detail(workspaceId, habitId) })
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: habitKeys.list(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}

export function useArchiveHabitMutation(workspaceId: string, queryToInvalidate?: HabitsQuery) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (habitId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }
      return archiveHabit(workspaceId, habitId)
    },
    onSuccess: async (_data, habitId) => {
      await queryClient.invalidateQueries({ queryKey: habitKeys.all(workspaceId) })
      await queryClient.invalidateQueries({ queryKey: habitKeys.detail(workspaceId, habitId) })
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: habitKeys.list(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}

export function useDeleteHabitMutation(workspaceId: string, queryToInvalidate?: HabitsQuery) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (habitId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }
      return deleteHabit(workspaceId, habitId)
    },
    onSuccess: async (_data, habitId) => {
      await queryClient.invalidateQueries({ queryKey: habitKeys.all(workspaceId) })
      await queryClient.removeQueries({ queryKey: habitKeys.detail(workspaceId, habitId) })
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: habitKeys.list(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}
