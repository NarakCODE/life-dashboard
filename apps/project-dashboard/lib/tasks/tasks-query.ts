import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createTask,
  deleteTask,
  getMyTasks,
  updateTask,
} from "@/lib/tasks/tasks-client"
import type {
  CreateTaskInput,
  MyTasksQuery,
  UpdateTaskInput,
} from "@/lib/tasks/types"

export const taskKeys = {
  all: (workspaceId: string) => ["workspace", workspaceId, "tasks"] as const,
  myTasks: (workspaceId: string, query: MyTasksQuery) =>
    [...taskKeys.all(workspaceId), "my-tasks", query] as const,
  projects: (workspaceId: string) =>
    ["workspace", workspaceId, "projects"] as const,
  dashboard: (workspaceId: string) =>
    ["workspace", workspaceId, "dashboard", "stats"] as const,
}

export function useMyTasksQuery(
  workspaceId: string,
  query: MyTasksQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: taskKeys.myTasks(workspaceId, query),
    queryFn: () => getMyTasks(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
  })
}

export function useCreateTaskMutation(
  workspaceId: string,
  queryToInvalidate?: MyTasksQuery,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTaskInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return createTask(workspaceId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all(workspaceId) })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: taskKeys.myTasks(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}

export function useUpdateTaskMutation(
  workspaceId: string,
  queryToInvalidate?: MyTasksQuery,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      input,
    }: {
      taskId: string
      input: UpdateTaskInput
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return updateTask(workspaceId, taskId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all(workspaceId) })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: taskKeys.myTasks(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}

export function useDeleteTaskMutation(
  workspaceId: string,
  queryToInvalidate?: MyTasksQuery,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return deleteTask(workspaceId, taskId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all(workspaceId) })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: taskKeys.myTasks(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}
