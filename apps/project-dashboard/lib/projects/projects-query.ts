import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createProject,
  deleteProject,
  getProject,
  type ProjectInput,
  type ProjectSummary,
  getProjects,
  getTaskProjects,
  updateProject,
  type UpdateProjectInput,
} from "@/lib/projects/projects-client"
import {
  getProjectDetails,
  moveProjectTask,
  patchProjectTask,
  reorderProjectTasks,
  reorderProjectWorkstreamTasks,
} from "@/lib/projects/project-details-client"
import { taskKeys } from "@/lib/tasks/tasks-query"
import type { UpdateTaskInput } from "@/lib/tasks/types"

export const projectKeys = {
  list: (workspaceId: string) => ["workspace", workspaceId, "projects"] as const,
  detail: (workspaceId: string, projectId: string) =>
    ["workspace", workspaceId, "projects", projectId] as const,
  details: (workspaceId: string, projectId: string) =>
    ["workspace", workspaceId, "projects", projectId, "details"] as const,
}

export function useTaskProjectsQuery(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.projects(workspaceId),
    queryFn: () => getTaskProjects(workspaceId),
    enabled: enabled && Boolean(workspaceId),
  })
}

export function useProjectsQuery(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.list(workspaceId),
    queryFn: () => getProjects(workspaceId),
    enabled: enabled && Boolean(workspaceId),
  })
}

export function useProjectQuery(
  workspaceId: string,
  projectId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: projectKeys.detail(workspaceId, projectId),
    queryFn: () => getProject(workspaceId, projectId),
    enabled: enabled && Boolean(workspaceId) && Boolean(projectId),
  })
}

export function useProjectDetailsQuery(
  workspaceId: string,
  projectId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: projectKeys.details(workspaceId, projectId),
    queryFn: () => getProjectDetails(workspaceId, projectId),
    enabled: enabled && Boolean(workspaceId) && Boolean(projectId),
  })
}

export function useCreateProjectMutation(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ProjectInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return createProject(workspaceId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.list(workspaceId) })
      await queryClient.invalidateQueries({ queryKey: taskKeys.projects(workspaceId) })
    },
  })
}

export function useUpdateProjectMutation(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string
      input: UpdateProjectInput
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return updateProject(workspaceId, projectId, input)
    },
    onSuccess: async (project: ProjectSummary) => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.list(workspaceId) })
      await queryClient.invalidateQueries({ queryKey: taskKeys.projects(workspaceId) })
      await queryClient.invalidateQueries({
        queryKey: projectKeys.detail(workspaceId, project.id),
      })
      await queryClient.invalidateQueries({
        queryKey: projectKeys.details(workspaceId, project.id),
      })
      queryClient.setQueryData<ProjectSummary[] | undefined>(
        projectKeys.list(workspaceId),
        (current) =>
          current?.map((item) => (item.id === project.id ? project : item)) ?? current,
      )
      queryClient.setQueryData(projectKeys.detail(workspaceId, project.id), project)
    },
  })
}

export function useDeleteProjectMutation(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return deleteProject(workspaceId, projectId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.list(workspaceId) })
      await queryClient.invalidateQueries({ queryKey: taskKeys.projects(workspaceId) })
    },
  })
}

export function usePatchProjectTaskMutation(
  workspaceId: string,
  projectId: string,
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

      return patchProjectTask(workspaceId, projectId, taskId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectKeys.details(workspaceId, projectId),
      })
      await queryClient.invalidateQueries({ queryKey: taskKeys.all(workspaceId) })
    },
  })
}

export function useMoveProjectTaskMutation(
  workspaceId: string,
  projectId: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      targetWorkstreamId,
      targetOrder,
    }: {
      taskId: string
      targetWorkstreamId?: string
      targetOrder?: number
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return moveProjectTask(workspaceId, projectId, taskId, {
        targetWorkstreamId,
        targetOrder,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectKeys.details(workspaceId, projectId),
      })
      await queryClient.invalidateQueries({ queryKey: taskKeys.all(workspaceId) })
    },
  })
}

export function useReorderProjectWorkstreamTasksMutation(
  workspaceId: string,
  projectId: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workstreamId,
      taskIds,
    }: {
      workstreamId: string
      taskIds: string[]
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return reorderProjectWorkstreamTasks(workspaceId, projectId, workstreamId, taskIds)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectKeys.details(workspaceId, projectId),
      })
      await queryClient.invalidateQueries({ queryKey: taskKeys.all(workspaceId) })
    },
  })
}

export function useReorderProjectTasksMutation(
  workspaceId: string,
  projectId: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskIds: string[]) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return reorderProjectTasks(workspaceId, projectId, taskIds)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectKeys.details(workspaceId, projectId),
      })
      await queryClient.invalidateQueries({ queryKey: taskKeys.all(workspaceId) })
    },
  })
}
