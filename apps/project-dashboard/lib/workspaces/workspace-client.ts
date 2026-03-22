import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client"
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceInvitation,
  InviteMemberInput,
  WorkspaceContext,
} from "./workspace-types"

// Handle double-wrapped API response: { success: true, data: { success: true, data: [...] } }
interface DoubleWrappedResponse<T> {
  success: boolean
  data: T
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<Workspace[]>>({
    path: "/workspaces",
    method: "GET",
    auth: "required",
  })
  // Extract from nested structure: envelope.data.data
  return response.data.data ?? response.data
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<Workspace>>({
    path: `/workspaces/${id}`,
    method: "GET",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<Workspace>>({
    path: "/workspaces",
    method: "POST",
    body: input,
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function updateWorkspace(
  id: string,
  input: UpdateWorkspaceInput
): Promise<Workspace> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<Workspace>>({
    path: `/workspaces/${id}`,
    method: "PATCH",
    body: input,
    auth: "required",
  })
  return response.data.data ?? response.data
}

export function deleteWorkspace(id: string) {
  return apiRequest<void>({
    path: `/workspaces/${id}`,
    method: "DELETE",
    auth: "required",
  })
}

export async function switchWorkspace(id: string): Promise<{ workspaceId: string }> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<{ workspaceId: string }>>({
    path: `/workspaces/${id}/switch`,
    method: "POST",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function resolveWorkspaceContext(
  workspaceId?: string
): Promise<WorkspaceContext> {
  const path = workspaceId
    ? `/workspaces/resolve-context?workspaceId=${encodeURIComponent(workspaceId)}`
    : "/workspaces/resolve-context"

  const response = await apiRequestEnvelope<DoubleWrappedResponse<WorkspaceContext>>({
    path,
    method: "GET",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function getMyInvitations(): Promise<WorkspaceInvitation[]> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<WorkspaceInvitation[]>>({
    path: "/workspaces/invitations/mine",
    method: "GET",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function getWorkspaceInvitations(
  workspaceId: string,
): Promise<WorkspaceInvitation[]> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<WorkspaceInvitation[]>>({
    path: `/workspaces/${workspaceId}/invitations`,
    method: "GET",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function inviteMember(
  workspaceId: string,
  input: InviteMemberInput
): Promise<WorkspaceInvitation> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<WorkspaceInvitation>>({
    path: `/workspaces/${workspaceId}/invitations`,
    method: "POST",
    body: input,
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function acceptInvitation(invitationId: string): Promise<WorkspaceInvitation> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<WorkspaceInvitation>>({
    path: `/workspaces/invitations/${invitationId}/accept`,
    method: "POST",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function rejectInvitation(invitationId: string): Promise<WorkspaceInvitation> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<WorkspaceInvitation>>({
    path: `/workspaces/invitations/${invitationId}/reject`,
    method: "POST",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function revokeInvitation(
  workspaceId: string,
  invitationId: string
): Promise<WorkspaceInvitation> {
  const response = await apiRequestEnvelope<DoubleWrappedResponse<WorkspaceInvitation>>({
    path: `/workspaces/${workspaceId}/invitations/${invitationId}`,
    method: "DELETE",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export function removeMember(workspaceId: string, memberId: string) {
  return apiRequest<void>({
    path: `/workspaces/${workspaceId}/members/${memberId}`,
    method: "DELETE",
    auth: "required",
  })
}

export function leaveWorkspace(workspaceId: string) {
  return apiRequest<void>({
    path: `/workspaces/${workspaceId}/leave`,
    method: "POST",
    auth: "required",
  })
}
