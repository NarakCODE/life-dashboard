import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-client";
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
  WorkspaceContext,
  WorkspaceInvitation,
  WorkspaceJoinRequest,
  WorkspaceJoinLink,
  WorkspaceJoinInfo,
  UpdateJoinLinkInput,
} from "./workspace-types";
import {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  switchWorkspace,
  resolveWorkspaceContext,
  getMyInvitations,
  getWorkspaceInvitations,
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  revokeInvitation,
  removeMember,
  leaveWorkspace,
  createJoinLink,
  updateJoinLink,
  getJoinLinkInfo,
  createJoinRequest,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from "./workspace-client";

// ============================================================================
// Query Key Factory
// ============================================================================

export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  list: (filters: { status?: string } = {}) =>
    [...workspaceKeys.lists(), filters] as const,
  details: () => [...workspaceKeys.all, "detail"] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  context: () => [...workspaceKeys.all, "context"] as const,
  contextWithId: (id?: string) => [...workspaceKeys.context(), { id }] as const,
  invitations: () => [...workspaceKeys.all, "invitations"] as const,
  myInvitations: () => [...workspaceKeys.invitations(), "mine"] as const,
  workspaceInvitations: (workspaceId: string) =>
    [...workspaceKeys.invitations(), "workspace", workspaceId] as const,
  joinLink: () => [...workspaceKeys.all, "join-link"] as const,
  joinLinkByWorkspace: (workspaceId: string) =>
    [...workspaceKeys.joinLink(), workspaceId] as const,
  joinRequests: () => [...workspaceKeys.all, "join-requests"] as const,
  joinRequestsByWorkspace: (workspaceId: string) =>
    [...workspaceKeys.joinRequests(), workspaceId] as const,
  joinInfo: () => [...workspaceKeys.all, "join-info"] as const,
  joinInfoByToken: (token: string) =>
    [...workspaceKeys.joinInfo(), token] as const,
} as const;

// ============================================================================
// Default Configurations
// ============================================================================

const defaultStaleTime = 5 * 60 * 1000; // 5 minutes
const defaultGcTime = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// Query Options Factories (for SSR/prefetching)
// ============================================================================

export const workspaceQueries = {
  all: () => ({
    queryKey: workspaceKeys.lists(),
    queryFn: getWorkspaces,
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
  }),

  detail: (id: string) => ({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => getWorkspace(id),
    enabled: !!id,
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
  }),

  context: (workspaceId?: string) => ({
    queryKey: workspaceKeys.contextWithId(workspaceId),
    queryFn: () => resolveWorkspaceContext(workspaceId),
    staleTime: 30 * 1000, // 30 seconds - context changes frequently
    gcTime: 5 * 60 * 1000,
  }),

  myInvitations: () => ({
    queryKey: workspaceKeys.myInvitations(),
    queryFn: getMyInvitations,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  }),

  workspaceInvitations: (workspaceId: string) => ({
    queryKey: workspaceKeys.workspaceInvitations(workspaceId),
    queryFn: () => getWorkspaceInvitations(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  }),

  joinLink: (workspaceId: string) => ({
    queryKey: workspaceKeys.joinLinkByWorkspace(workspaceId),
    queryFn: () => createJoinLink(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  }),

  joinRequests: (workspaceId: string) => ({
    queryKey: workspaceKeys.joinRequestsByWorkspace(workspaceId),
    queryFn: () => getJoinRequests(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  }),

  joinInfo: (token: string) => ({
    queryKey: workspaceKeys.joinInfoByToken(token),
    queryFn: () => getJoinLinkInfo(token),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  }),
};

// ============================================================================
// Queries
// ============================================================================

export function useWorkspacesQuery(
  options?: Omit<
    UseQueryOptions<Workspace[], ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...workspaceQueries.all(),
    ...options,
  });
}

export function useWorkspaceQuery(
  id: string,
  options?: Omit<UseQueryOptions<Workspace, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery({
    ...workspaceQueries.detail(id),
    ...options,
  });
}

export function useWorkspaceContextQuery(
  workspaceId?: string,
  options?: Omit<
    UseQueryOptions<WorkspaceContext, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...workspaceQueries.context(workspaceId),
    ...options,
  });
}

export function useMyInvitationsQuery(
  options?: Omit<
    UseQueryOptions<WorkspaceInvitation[], ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...workspaceQueries.myInvitations(),
    ...options,
  });
}

export function useWorkspaceInvitationsQuery(
  workspaceId: string,
  options?: Omit<
    UseQueryOptions<WorkspaceInvitation[], ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...workspaceQueries.workspaceInvitations(workspaceId),
    ...options,
  });
}

export function useJoinLinkQuery(
  workspaceId: string,
  options?: Omit<
    UseQueryOptions<WorkspaceJoinLink, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...workspaceQueries.joinLink(workspaceId),
    ...options,
  });
}

export function useJoinRequestsQuery(
  workspaceId: string,
  options?: Omit<
    UseQueryOptions<WorkspaceJoinRequest[], ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...workspaceQueries.joinRequests(workspaceId),
    ...options,
  });
}

export function useJoinInfoQuery(
  token: string,
  options?: Omit<
    UseQueryOptions<WorkspaceJoinInfo, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    ...workspaceQueries.joinInfo(token),
    ...options,
  });
}

// ============================================================================
// Prefetch Helpers
// ============================================================================

export function prefetchWorkspace(
  queryClient: QueryClient,
  id: string,
): Promise<void> {
  return queryClient.prefetchQuery(workspaceQueries.detail(id));
}

export function prefetchWorkspaces(
  queryClient: QueryClient,
): Promise<void> {
  return queryClient.prefetchQuery(workspaceQueries.all());
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => createWorkspace(input),
    onSuccess: (newWorkspace) => {
      // Update the list cache directly with the new workspace
      queryClient.setQueryData<Workspace[]>(
        workspaceKeys.lists(),
        (old) => (old ? [...old, newWorkspace] : [newWorkspace]),
      );
      // Set the individual workspace cache
      queryClient.setQueryData(
        workspaceKeys.detail(newWorkspace.id),
        newWorkspace,
      );
    },
  });
}

export function useUpdateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkspaceInput }) =>
      updateWorkspace(id, input),
    onMutate: async ({ id, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: workspaceKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: workspaceKeys.lists() });

      // Snapshot previous values for rollback
      const previousWorkspace = queryClient.getQueryData<Workspace>(
        workspaceKeys.detail(id),
      );
      const previousWorkspaces = queryClient.getQueryData<Workspace[]>(
        workspaceKeys.lists(),
      );

      // Optimistically update the cache
      if (previousWorkspace) {
        queryClient.setQueryData<Workspace>(workspaceKeys.detail(id), {
          ...previousWorkspace,
          ...input,
        });
      }

      if (previousWorkspaces) {
        queryClient.setQueryData<Workspace[]>(
          workspaceKeys.lists(),
          previousWorkspaces.map((w) =>
            w.id === id ? { ...w, ...input } : w,
          ),
        );
      }

      // Return rollback context
      return { previousWorkspace, previousWorkspaces };
    },
    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previousWorkspace) {
        queryClient.setQueryData(
          workspaceKeys.detail(id),
          context.previousWorkspace,
        );
      }
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(
          workspaceKeys.lists(),
          context.previousWorkspaces,
        );
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.lists() });
      await queryClient.cancelQueries({ queryKey: workspaceKeys.detail(id) });

      const previousWorkspaces = queryClient.getQueryData<Workspace[]>(
        workspaceKeys.lists(),
      );
      const previousWorkspace = queryClient.getQueryData<Workspace>(
        workspaceKeys.detail(id),
      );

      // Optimistically remove from list
      if (previousWorkspaces) {
        queryClient.setQueryData<Workspace[]>(
          workspaceKeys.lists(),
          previousWorkspaces.filter((w) => w.id !== id),
        );
      }

      // NOTE: We don't remove the detail cache here - that happens only on success.
      // If we removed it optimistically and the delete fails, a detail page
      // mounted with that ID would lose its data and never refetch it
      // because onError/onSettled wouldn't restore removed queries.

      return { previousWorkspaces, previousWorkspace };
    },
    onError: (_error, id, context) => {
      // Rollback the list
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(
          workspaceKeys.lists(),
          context.previousWorkspaces,
        );
      }
      // Restore the detail (no-op if still present, restores if was removed elsewhere)
      if (context?.previousWorkspace) {
        queryClient.setQueryData(
          workspaceKeys.detail(id),
          context.previousWorkspace,
        );
      }
    },
    onSuccess: (_data, id) => {
      // Only remove the detail cache after confirmed success
      queryClient.removeQueries({ queryKey: workspaceKeys.detail(id) });
    },
    onSettled: (_data, _error, id) => {
      // Always refetch lists to ensure sync
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.context() });
      // Also invalidate the detail to trigger refetch if it still exists
      // (on error, this restores the query to fresh state)
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(id) });
    },
  });
}

export function useSwitchWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => switchWorkspace(id),
    onSuccess: () => {
      // Context changes when switching workspaces
      queryClient.invalidateQueries({ queryKey: workspaceKeys.context() });
      // Workspace list may show active status changes
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      input,
    }: {
      workspaceId: string;
      input: InviteMemberInput;
    }) => inviteMember(workspaceId, input),
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.workspaceInvitations(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
    },
  });
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    onSuccess: () => {
      // Clear invitations cache
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.myInvitations(),
      });
      // User now has access to new workspace
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      // Context may have changed
      queryClient.invalidateQueries({ queryKey: workspaceKeys.context() });
    },
  });
}

export function useRejectInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => rejectInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.myInvitations(),
      });
    },
  });
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      invitationId,
    }: {
      workspaceId: string;
      invitationId: string;
    }) => revokeInvitation(workspaceId, invitationId),
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.workspaceInvitations(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string;
      memberId: string;
    }) => removeMember(workspaceId, memberId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useLeaveWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => leaveWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.context() });
    },
  });
}

// ============================================================================
// Join Link Mutations
// ============================================================================

export function useCreateJoinLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => createJoinLink(workspaceId),
    onSuccess: (_data, workspaceId) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.joinLinkByWorkspace(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
    },
  });
}

export function useUpdateJoinLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      workspaceId: string;
      input: UpdateJoinLinkInput;
    }) => updateJoinLink(variables.workspaceId, variables.input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.joinLinkByWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(variables.workspaceId),
      });
    },
  });
}

// ============================================================================
// Join Request Mutations
// ============================================================================

export function useCreateJoinRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => createJoinRequest(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.context() });
    },
  });
}

export function useApproveJoinRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      requestId,
    }: {
      workspaceId: string;
      requestId: string;
    }) => approveJoinRequest(workspaceId, requestId),
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.joinRequestsByWorkspace(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useRejectJoinRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      requestId,
    }: {
      workspaceId: string;
      requestId: string;
    }) => rejectJoinRequest(workspaceId, requestId),
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.joinRequestsByWorkspace(workspaceId),
      });
    },
  });
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
  WorkspaceContext,
  WorkspaceInvitation,
  WorkspaceJoinRequest,
  WorkspaceJoinLink,
  WorkspaceJoinInfo,
  UpdateJoinLinkInput,
};
