import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { ApiError } from "@/lib/api/api-client"
import type {
  WorkspaceMemberWithDetails,
  UpdateMemberRoleInput,
  InviteMemberInput,
  WorkspaceInvitation,
} from "./members-types"
import {
  getWorkspaceMembers,
  updateMemberRole,
  removeMemberFromWorkspace,
  inviteMemberToWorkspace,
  getWorkspaceInvitationsList,
  revokeWorkspaceInvitation,
} from "./members-client"

// ============================================================================
// Query Key Factory
// ============================================================================

export const membersKeys = {
  all: ["members"] as const,
  lists: () => [...membersKeys.all, "list"] as const,
  list: (workspaceId: string) =>
    [...membersKeys.lists(), workspaceId] as const,
  invitations: () => [...membersKeys.all, "invitations"] as const,
  workspaceInvitations: (workspaceId: string) =>
    [...membersKeys.invitations(), workspaceId] as const,
} as const

// ============================================================================
// Default Configurations
// ============================================================================

const defaultStaleTime = 2 * 60 * 1000 // 2 minutes
const defaultGcTime = 5 * 60 * 1000 // 5 minutes

// ============================================================================
// Query Options Factories
// ============================================================================

export const membersQueries = {
  list: (workspaceId: string) => ({
    queryKey: membersKeys.list(workspaceId),
    queryFn: () => getWorkspaceMembers(workspaceId),
    enabled: !!workspaceId,
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
  }),

  workspaceInvitations: (workspaceId: string) => ({
    queryKey: membersKeys.workspaceInvitations(workspaceId),
    queryFn: () => getWorkspaceInvitationsList(workspaceId),
    enabled: !!workspaceId,
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
  }),
}

// ============================================================================
// Hooks
// ============================================================================

export function useWorkspaceMembersQuery(
  workspaceId: string,
  options?: Omit<
    UseQueryOptions<WorkspaceMemberWithDetails[], ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...membersQueries.list(workspaceId),
    ...options,
  })
}

export function useWorkspaceInvitationsQuery(
  workspaceId: string,
  options?: Omit<
    UseQueryOptions<WorkspaceInvitation[], ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...membersQueries.workspaceInvitations(workspaceId),
    ...options,
  })
}

// ============================================================================
// Mutations
// ============================================================================

export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
      input,
    }: {
      workspaceId: string
      memberId: string
      input: UpdateMemberRoleInput
    }) => updateMemberRole(workspaceId, memberId, input),
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: membersKeys.list(workspaceId),
      })
    },
  })
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string
      memberId: string
    }) => removeMemberFromWorkspace(workspaceId, memberId),
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: membersKeys.list(workspaceId),
      })
    },
  })
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workspaceId,
      input,
    }: {
      workspaceId: string
      input: InviteMemberInput
    }) => inviteMemberToWorkspace(workspaceId, input),
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: membersKeys.workspaceInvitations(workspaceId),
      })
      queryClient.invalidateQueries({
        queryKey: membersKeys.list(workspaceId),
      })
    },
  })
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workspaceId,
      invitationId,
    }: {
      workspaceId: string
      invitationId: string
    }) => revokeWorkspaceInvitation(workspaceId, invitationId),
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: membersKeys.workspaceInvitations(workspaceId),
      })
    },
  })
}
