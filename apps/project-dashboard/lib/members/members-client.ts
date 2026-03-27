import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client"
import type {
  WorkspaceMemberWithDetails,
  UpdateMemberRoleInput,
  InviteMemberInput,
  WorkspaceInvitation,
} from "./members-types"

interface DoubleWrappedResponse<T> {
  success: boolean
  data: T
}

export async function getWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMemberWithDetails[]> {
  const response = await apiRequestEnvelope<
    DoubleWrappedResponse<WorkspaceMemberWithDetails[]>
  >({
    path: `/workspaces/${workspaceId}/members`,
    method: "GET",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  input: UpdateMemberRoleInput,
): Promise<WorkspaceMemberWithDetails> {
  const response = await apiRequestEnvelope<
    DoubleWrappedResponse<WorkspaceMemberWithDetails>
  >({
    path: `/workspaces/${workspaceId}/members/${memberId}`,
    method: "PATCH",
    body: input,
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function removeMemberFromWorkspace(
  workspaceId: string,
  memberId: string,
): Promise<void> {
  await apiRequest<void>({
    path: `/workspaces/${workspaceId}/members/${memberId}`,
    method: "DELETE",
    auth: "required",
  })
}

export async function inviteMemberToWorkspace(
  workspaceId: string,
  input: InviteMemberInput,
): Promise<WorkspaceInvitation> {
  const response = await apiRequestEnvelope<
    DoubleWrappedResponse<WorkspaceInvitation>
  >({
    path: `/workspaces/${workspaceId}/invitations`,
    method: "POST",
    body: input,
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function getWorkspaceInvitationsList(
  workspaceId: string,
): Promise<WorkspaceInvitation[]> {
  const response = await apiRequestEnvelope<
    DoubleWrappedResponse<WorkspaceInvitation[]>
  >({
    path: `/workspaces/${workspaceId}/invitations`,
    method: "GET",
    auth: "required",
  })
  return response.data.data ?? response.data
}

export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<WorkspaceInvitation> {
  const response = await apiRequestEnvelope<
    DoubleWrappedResponse<WorkspaceInvitation>
  >({
    path: `/workspaces/${workspaceId}/invitations/${invitationId}`,
    method: "DELETE",
    auth: "required",
  })
  return response.data.data ?? response.data
}
