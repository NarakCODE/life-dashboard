/**
 * Workspace types matching the API response format
 */

export interface UserDetails {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
}

export interface WorkspaceMember {
  userId: string
  role: WorkspaceRole
  user: UserDetails
}

export type WorkspaceType = "solo" | "collaborative"
export type WorkspaceStatus = "active" | "archived"
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"

export interface Workspace {
  id: string
  name: string
  type: WorkspaceType
  status: WorkspaceStatus
  ownerId: string
  owner: UserDetails
  createdById: string
  createdBy: UserDetails
  defaultForUserId: string | null
  members: WorkspaceMember[]
  createdAt: string
  updatedAt: string
}

export interface CreateWorkspaceInput {
  name: string
}

export interface UpdateWorkspaceInput {
  name?: string
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
  acceptedBy?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
}

export interface InviteMemberInput {
  email: string
  role: WorkspaceRole
}

export interface WorkspaceContext {
  workspaceId: string
  actorUserId: string
  role: WorkspaceRole
  membershipStatus: string
  permissions: string[]
  workspaceName: string
  workspaceType: WorkspaceType
  defaultWorkspaceId: string | null
  activeWorkspaceId: string | null
}
