/**
 * Workspace members types
 */

import type { WorkspaceRole, UserDetails } from "../workspaces/workspace-types"

export interface WorkspaceMemberWithDetails {
  userId: string
  role: WorkspaceRole
  user: UserDetails
  joinedAt?: string
}

export interface WorkspaceMemberListResponse {
  success: boolean
  data: WorkspaceMemberWithDetails[]
}

export interface UpdateMemberRoleInput {
  role: WorkspaceRole
}

export interface InviteMemberInput {
  email: string
  role: WorkspaceRole
}

export interface WorkspaceInvitation {
  id: string
  workspaceId: string
  email: string
  role: WorkspaceRole
  status: "pending" | "accepted" | "rejected" | "revoked"
  token: string
  expiresAt: string
  invitedBy: string
  invitedByUser?: UserDetails
  acceptedBy?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
}
