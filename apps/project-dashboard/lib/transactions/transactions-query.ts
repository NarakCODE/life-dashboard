import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  getTransactionSummary,
  updateTransaction,
} from "@/lib/transactions/transactions-client";
import type {
  CreateTransactionInput,
  TransactionsQuery,
  UpdateTransactionInput,
} from "@/lib/transactions/types";

export const transactionKeys = {
  all: (workspaceId: string) =>
    ["workspace", workspaceId, "transactions"] as const,
  list: (workspaceId: string, query: TransactionsQuery) =>
    [...transactionKeys.all(workspaceId), "list", query] as const,
  detail: (workspaceId: string, transactionId: string) =>
    [...transactionKeys.all(workspaceId), "detail", transactionId] as const,
  summary: (workspaceId: string, query: TransactionsQuery) =>
    [...transactionKeys.all(workspaceId), "summary", query] as const,
};

export function useTransactionsQuery(
  workspaceId: string,
  query: TransactionsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: transactionKeys.list(workspaceId, query),
    queryFn: () => getTransactions(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
  });
}

export function useTransactionSummaryQuery(
  workspaceId: string,
  query: TransactionsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: transactionKeys.summary(workspaceId, query),
    queryFn: () => getTransactionSummary(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
  });
}

export function useTransactionQuery(
  workspaceId: string,
  transactionId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: transactionKeys.detail(workspaceId, transactionId),
    queryFn: () => getTransaction(workspaceId, transactionId),
    enabled: enabled && Boolean(workspaceId) && Boolean(transactionId),
  });
}

export function useCreateTransactionMutation(
  workspaceId: string,
  queryToInvalidate?: TransactionsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return createTransaction(workspaceId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: transactionKeys.all(workspaceId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: transactionKeys.list(workspaceId, queryToInvalidate),
        });
        await queryClient.invalidateQueries({
          queryKey: transactionKeys.summary(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useUpdateTransactionMutation(
  workspaceId: string,
  queryToInvalidate?: TransactionsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      input,
    }: {
      transactionId: string;
      input: UpdateTransactionInput;
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return updateTransaction(workspaceId, transactionId, input);
    },
    onSuccess: async (_data, { transactionId }) => {
      await queryClient.invalidateQueries({
        queryKey: transactionKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(workspaceId, transactionId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: transactionKeys.list(workspaceId, queryToInvalidate),
        });
        await queryClient.invalidateQueries({
          queryKey: transactionKeys.summary(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useDeleteTransactionMutation(
  workspaceId: string,
  queryToInvalidate?: TransactionsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return deleteTransaction(workspaceId, transactionId);
    },
    onSuccess: async (_data, transactionId) => {
      await queryClient.invalidateQueries({
        queryKey: transactionKeys.all(workspaceId),
      });
      await queryClient.removeQueries({
        queryKey: transactionKeys.detail(workspaceId, transactionId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: transactionKeys.list(workspaceId, queryToInvalidate),
        });
        await queryClient.invalidateQueries({
          queryKey: transactionKeys.summary(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}
