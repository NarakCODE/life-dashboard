"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIssue,
  deleteIssue,
  getIssueById,
  getIssues,
  getMyIssues,
  updateIssue,
} from "./issue-api";
import type {
  ApiContext,
  CreateIssueInput,
  IssueQueryParams,
  UpdateIssueInput,
} from "./issue-types";

export const issueKeys = {
  all: ["issues"] as const,
  lists: () => [...issueKeys.all, "list"] as const,
  list: (workspaceId: string | null, params?: IssueQueryParams) =>
    [...issueKeys.lists(), workspaceId, params] as const,
  my: (workspaceId: string | null, params?: IssueQueryParams) =>
    [...issueKeys.all, "my", workspaceId, params] as const,
  detail: (workspaceId: string | null, issueId: string) =>
    [...issueKeys.all, "detail", workspaceId, issueId] as const,
};

export function useIssuesQuery(context: ApiContext, params?: IssueQueryParams) {
  return useQuery({
    queryKey: issueKeys.list(context.workspaceId, params),
    queryFn: () => getIssues(context, params),
    enabled: Boolean(context.accessToken && context.workspaceId),
  });
}

export function useMyIssuesQuery(
  context: ApiContext,
  params?: IssueQueryParams,
) {
  return useQuery({
    queryKey: issueKeys.my(context.workspaceId, params),
    queryFn: () => getMyIssues(context, params),
    enabled: Boolean(context.accessToken && context.workspaceId),
  });
}

export function useIssueQuery(context: ApiContext, issueId: string) {
  return useQuery({
    queryKey: issueKeys.detail(context.workspaceId, issueId),
    queryFn: () => getIssueById(context, issueId),
    enabled: Boolean(context.accessToken && context.workspaceId && issueId),
  });
}

export function useCreateIssueMutation(context: ApiContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIssueInput) => createIssue(context, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

export function useUpdateIssueMutation(context: ApiContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      input,
    }: {
      issueId: string;
      input: UpdateIssueInput;
    }) => updateIssue(context, issueId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

export function useDeleteIssueMutation(context: ApiContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueId: string) => deleteIssue(context, issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}
