import { useMutation, useQueryClient } from "@tanstack/react-query"
import { projectKeys } from "@/lib/projects/projects-query"
import { taskKeys } from "@/lib/tasks/tasks-query"
import {
  createProjectWithWizard,
  validateProjectWizard,
} from "./project-wizard-client"
import type { CreateProjectWizardInput } from "./types"

export const projectWizardKeys = {
  all: (workspaceId: string) =>
    ["workspace", workspaceId, "project-wizard"] as const,
  validate: (workspaceId: string) =>
    ["workspace", workspaceId, "project-wizard", "validate"] as const,
}

/**
 * Mutation hook for creating a project with full wizard data
 */
export function useCreateProjectWizardMutation(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProjectWizardInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return createProjectWithWizard(workspaceId, input)
    },
    onSuccess: async () => {
      // Invalidate project lists to refresh
      await queryClient.invalidateQueries({
        queryKey: projectKeys.list(workspaceId),
      })
      await queryClient.invalidateQueries({
        queryKey: taskKeys.projects(workspaceId),
      })
    },
  })
}

/**
 * Mutation hook for validating wizard data before submission
 */
export function useValidateProjectWizardMutation(workspaceId: string) {
  return useMutation({
    mutationFn: (input: Partial<CreateProjectWizardInput>) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return validateProjectWizard(workspaceId, input)
    },
  })
}
