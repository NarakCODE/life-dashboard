import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-client";
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
  WorkspaceContext,
  WorkspaceInvitation,
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
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  revokeInvitation,
  removeMember,
  leaveWorkspace,
} from "./workspace-client";

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
};

// Queries
export function useWorkspacesQuery(
  options?: Omit<
    UseQueryOptions<Workspace[], ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: workspaceKeys.lists(),
    queryFn: getWorkspaces,
    ...options,
  });
}

export function useWorkspaceQuery(
  id: string,
  options?: Omit<UseQueryOptions<Workspace, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => getWorkspace(id),
    enabled: !!id,
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
    queryKey: workspaceKeys.contextWithId(workspaceId),
    queryFn: () => resolveWorkspaceContext(workspaceId),
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
    queryKey: workspaceKeys.myInvitations(),
    queryFn: getMyInvitations,
    ...options,
  });
}

// Mutations
export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => createWorkspace(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useUpdateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkspaceInput }) =>
      updateWorkspace(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useSwitchWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => switchWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.context() });
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
    onSuccess: (_, { workspaceId }) => {
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
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.myInvitations(),
      });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
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
    onSuccess: (_, { workspaceId }) => {
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
