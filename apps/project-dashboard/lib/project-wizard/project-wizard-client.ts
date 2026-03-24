import { apiRequest } from "@/lib/api/api-client"
import type {
  CreateProjectWizardInput,
  CreateProjectWizardResponse,
} from "./types"

/**
 * Create a new project with full wizard data
 */
export async function createProjectWithWizard(
  workspaceId: string,
  input: CreateProjectWizardInput
): Promise<CreateProjectWizardResponse> {
  return apiRequest<CreateProjectWizardResponse>({
    path: "/projects/wizard",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  })
}

/**
 * Validate project wizard data before submission
 * Useful for checking if deliverables/metrics are valid
 */
export async function validateProjectWizard(
  workspaceId: string,
  input: Partial<CreateProjectWizardInput>
): Promise<{ valid: boolean; errors?: string[] }> {
  return apiRequest<{ valid: boolean; errors?: string[] }>({
    path: "/projects/wizard/validate",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  })
}
