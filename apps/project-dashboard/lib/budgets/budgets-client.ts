import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client"
import type {
  Budget,
  BudgetSummary,
  BudgetsQuery,
  BudgetsResponse,
  BudgetsResponseData,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/lib/budgets/types"

function buildQueryString(query: BudgetsQuery) {
  const params = new URLSearchParams()

  const entries = Object.entries(query) as Array<
    [keyof BudgetsQuery, BudgetsQuery[keyof BudgetsQuery]]
  >

  for (const [key, value] of entries) {
    if (value === undefined || value === null || value === "") continue
    params.set(key, String(value))
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

export async function getBudgets(
  workspaceId: string,
  query: BudgetsQuery,
): Promise<BudgetsResponse> {
  const payload = await apiRequestEnvelope<
    BudgetsResponseData,
    Record<string, unknown>
  >({
    path: `/budgets${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })

  return {
    data: payload.data,
    meta: payload.meta ?? {},
  }
}

export async function getBudget(
  workspaceId: string,
  budgetId: string,
): Promise<Budget> {
  return apiRequest<Budget>({
    path: `/budgets/${budgetId}`,
    auth: "required",
    workspaceId,
  })
}

export async function getBudgetSummary(
  workspaceId: string,
  query: BudgetsQuery,
): Promise<BudgetSummary[]> {
  return apiRequest<BudgetSummary[]>({
    path: `/budgets/summary${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })
}

export async function createBudget(
  workspaceId: string,
  input: CreateBudgetInput,
): Promise<Budget> {
  return apiRequest<Budget>({
    path: "/budgets",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function updateBudget(
  workspaceId: string,
  budgetId: string,
  input: UpdateBudgetInput,
): Promise<Budget> {
  return apiRequest<Budget>({
    path: `/budgets/${budgetId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export async function deleteBudget(
  workspaceId: string,
  budgetId: string,
): Promise<{ success: true }> {
  return apiRequest<{ success: true }>({
    path: `/budgets/${budgetId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  })
}
