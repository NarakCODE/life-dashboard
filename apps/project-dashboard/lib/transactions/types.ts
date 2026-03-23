export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
}

export enum TransactionCategory {
  FOOD = "food",
  TRANSPORT = "transport",
  HOUSING = "housing",
  HEALTH = "health",
  ENTERTAINMENT = "entertainment",
  SHOPPING = "shopping",
  EDUCATION = "education",
  SALARY = "salary",
  INVESTMENT = "investment",
  OTHER = "other",
}

export interface Transaction {
  id: string;
  userId: string;
  budgetId?: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description?: string;
  date: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  type?: TransactionType;
  category?: TransactionCategory;
  budgetId?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface TransactionsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionsResponseData {
  items: Transaction[];
  pagination: TransactionsPagination;
}

export interface TransactionsResponse {
  data: TransactionsResponseData;
  meta: Record<string, unknown>;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  byCategory: Array<{
    category: string;
    totalAmount: number;
    count: number;
  }>;
  byType: Array<{
    type: string;
    totalAmount: number;
    count: number;
  }>;
}

export interface CreateTransactionInput {
  budgetId?: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description?: string;
  date: string;
  currency?: string;
}

export interface UpdateTransactionInput {
  budgetId?: string;
  amount?: number;
  type?: TransactionType;
  category?: TransactionCategory;
  description?: string;
  date?: string;
  currency?: string;
}

export const TRANSACTION_CATEGORY_OPTIONS = [
  { id: TransactionCategory.FOOD, label: "Food", icon: "🍽️" },
  { id: TransactionCategory.TRANSPORT, label: "Transport", icon: "🚗" },
  { id: TransactionCategory.HOUSING, label: "Housing", icon: "🏠" },
  { id: TransactionCategory.HEALTH, label: "Health", icon: "🏥" },
  { id: TransactionCategory.ENTERTAINMENT, label: "Entertainment", icon: "🎬" },
  { id: TransactionCategory.SHOPPING, label: "Shopping", icon: "🛍️" },
  { id: TransactionCategory.EDUCATION, label: "Education", icon: "📚" },
  { id: TransactionCategory.SALARY, label: "Salary", icon: "💰" },
  { id: TransactionCategory.INVESTMENT, label: "Investment", icon: "📈" },
  { id: TransactionCategory.OTHER, label: "Other", icon: "📦" },
] as const;

export const TRANSACTION_TYPE_OPTIONS = [
  { id: TransactionType.INCOME, label: "Income", color: "emerald" },
  { id: TransactionType.EXPENSE, label: "Expense", color: "rose" },
] as const;
