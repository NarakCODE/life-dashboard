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
  all: ["tasks"] as const,
  myTasks: (query: MyTasksQuery) => [...taskKeys.all, "my-tasks", query] as const,
  projects: () => [...taskKeys.all, "projects"] as const,
}

export function useMyTasksQuery(query: MyTasksQuery, enabled = true) {
  return useQuery({
    queryKey: taskKeys.myTasks(query),
    queryFn: () => getMyTasks(query),
    enabled,
  })
}

export function useCreateTaskMutation(queryToInvalidate?: MyTasksQuery) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: taskKeys.myTasks(queryToInvalidate),
        })
      }
    },
  })
}

export function useUpdateTaskMutation(queryToInvalidate?: MyTasksQuery) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      input,
    }: {
      taskId: string
      input: UpdateTaskInput
    }) => updateTask(taskId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: taskKeys.myTasks(queryToInvalidate),
        })
      }
    },
  })
}

export function useDeleteTaskMutation(queryToInvalidate?: MyTasksQuery) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: taskKeys.myTasks(queryToInvalidate),
        })
      }
    },
  })
}
