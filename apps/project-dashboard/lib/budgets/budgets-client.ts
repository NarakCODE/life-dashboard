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

/**
 * Backend BudgetResponseDto structure
 */
interface BackendBudget {
  id: string
  workspaceId?: string | null
  userId: string
  name: string
  amount: number
  category?: string
  period: "weekly" | "monthly" | "quarterly" | "yearly" | "custom"
  startDate?: string
  endDate?: string
  currency: string
  isActive: boolean
  actualSpending?: number
  remainingAmount?: number
  percentUsed?: number
  isOverBudget?: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Transform backend BudgetResponseDto to frontend Budget format
 */
function transformBackendBudget(budget: BackendBudget): Budget {
  return {
    ...budget,
    startDate: budget.startDate ?? null,
    endDate: budget.endDate ?? null,
  } as Budget
}

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
    { items: BackendBudget[]; pagination: { total: number; page: number; limit: number; totalPages: number } },
    Record<string, unknown>
  >({
    path: `/budgets${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })

  return {
    data: {
      items: payload.data.items.map(transformBackendBudget),
      pagination: payload.data.pagination,
    },
    meta: payload.meta ?? {},
  }
}

export async function getBudget(
  workspaceId: string,
  budgetId: string,
): Promise<Budget> {
  const budget = await apiRequest<BackendBudget>({
    path: `/budgets/${budgetId}`,
    auth: "required",
    workspaceId,
  })
  return transformBackendBudget(budget)
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
  const budget = await apiRequest<BackendBudget>({
    path: "/budgets",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  })
  return transformBackendBudget(budget)
}

export async function updateBudget(
  workspaceId: string,
  budgetId: string,
  input: UpdateBudgetInput,
): Promise<Budget> {
  const budget = await apiRequest<BackendBudget>({
    path: `/budgets/${budgetId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  })
  return transformBackendBudget(budget)
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
