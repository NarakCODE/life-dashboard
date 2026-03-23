import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createBudget,
  deleteBudget,
  getBudget,
  getBudgets,
  getBudgetSummary,
  updateBudget,
} from "@/lib/budgets/budgets-client"
import type {
  BudgetsQuery,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/lib/budgets/types"

const defaultStaleTime = 30_000
const defaultGcTime = 5 * 60_000

export const budgetKeys = {
  all: (workspaceId: string) => ["workspace", workspaceId, "budgets"] as const,
  list: (workspaceId: string, query: BudgetsQuery) =>
    [...budgetKeys.all(workspaceId), "list", query] as const,
  summary: (workspaceId: string, query: BudgetsQuery) =>
    [...budgetKeys.all(workspaceId), "summary", query] as const,
  detail: (workspaceId: string, budgetId: string) =>
    [...budgetKeys.all(workspaceId), "detail", budgetId] as const,
}

export function useBudgetsQuery(
  workspaceId: string,
  query: BudgetsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: budgetKeys.list(workspaceId, query),
    queryFn: () => getBudgets(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
    placeholderData: keepPreviousData,
  })
}

export function useBudgetSummaryQuery(
  workspaceId: string,
  query: BudgetsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: budgetKeys.summary(workspaceId, query),
    queryFn: () => getBudgetSummary(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
    placeholderData: keepPreviousData,
  })
}

export function useBudgetQuery(
  workspaceId: string,
  budgetId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: budgetKeys.detail(workspaceId, budgetId),
    queryFn: () => getBudget(workspaceId, budgetId),
    enabled: enabled && Boolean(workspaceId) && Boolean(budgetId),
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
  })
}

export function useCreateBudgetMutation(
  workspaceId: string,
  queryToInvalidate?: BudgetsQuery,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBudgetInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return createBudget(workspaceId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: budgetKeys.all(workspaceId),
      })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: budgetKeys.list(workspaceId, queryToInvalidate),
        })
        await queryClient.invalidateQueries({
          queryKey: budgetKeys.summary(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}

export function useUpdateBudgetMutation(
  workspaceId: string,
  queryToInvalidate?: BudgetsQuery,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      budgetId,
      input,
    }: {
      budgetId: string
      input: UpdateBudgetInput
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return updateBudget(workspaceId, budgetId, input)
    },
    onSuccess: async (_data, { budgetId }) => {
      await queryClient.invalidateQueries({
        queryKey: budgetKeys.all(workspaceId),
      })
      await queryClient.invalidateQueries({
        queryKey: budgetKeys.detail(workspaceId, budgetId),
      })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: budgetKeys.list(workspaceId, queryToInvalidate),
        })
        await queryClient.invalidateQueries({
          queryKey: budgetKeys.summary(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}

export function useDeleteBudgetMutation(
  workspaceId: string,
  queryToInvalidate?: BudgetsQuery,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (budgetId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return deleteBudget(workspaceId, budgetId)
    },
    onSuccess: async (_data, budgetId) => {
      await queryClient.invalidateQueries({
        queryKey: budgetKeys.all(workspaceId),
      })
      await queryClient.removeQueries({
        queryKey: budgetKeys.detail(workspaceId, budgetId),
      })

      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: budgetKeys.list(workspaceId, queryToInvalidate),
        })
        await queryClient.invalidateQueries({
          queryKey: budgetKeys.summary(workspaceId, queryToInvalidate),
        })
      }
    },
  })
}
