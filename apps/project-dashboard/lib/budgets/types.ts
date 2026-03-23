export enum BudgetPeriod {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
  CUSTOM = "custom",
}

export interface Budget {
  id: string
  workspaceId?: string | null
  userId: string
  name: string
  amount: number
  category?: string
  period: BudgetPeriod
  startDate?: string | null
  endDate?: string | null
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BudgetSummary extends Budget {
  actualSpending: number
  remainingAmount: number
  percentUsed: number
  isOverBudget: boolean
}

export interface BudgetsQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
  category?: string
  period?: BudgetPeriod
  isActive?: boolean
}

export interface BudgetsPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BudgetsResponseData {
  items: Budget[]
  pagination: BudgetsPagination
}

export interface BudgetsResponse {
  data: BudgetsResponseData
  meta: Record<string, unknown>
}

export interface CreateBudgetInput {
  name: string
  amount: number
  category?: string
  period?: BudgetPeriod
  startDate?: string
  endDate?: string
  currency?: string
}

export interface UpdateBudgetInput {
  name?: string
  amount?: number
  category?: string
  period?: BudgetPeriod
  startDate?: string
  endDate?: string
  currency?: string
  isActive?: boolean
}
