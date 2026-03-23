import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionsQuery,
  TransactionsResponse,
  TransactionsResponseData,
  TransactionSummary,
  UpdateTransactionInput,
} from "@/lib/transactions/types";

function buildQueryString(query: TransactionsQuery) {
  const params = new URLSearchParams();

  const entries = Object.entries(query) as Array<
    [keyof TransactionsQuery, TransactionsQuery[keyof TransactionsQuery]]
  >;

  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getTransactions(
  workspaceId: string,
  query: TransactionsQuery,
): Promise<TransactionsResponse> {
  const payload = await apiRequestEnvelope<
    TransactionsResponseData,
    Record<string, unknown>
  >({
    path: `/transactions${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  return {
    data: payload.data,
    meta: payload.meta ?? {},
  };
}

export async function getTransactionSummary(
  workspaceId: string,
  query: TransactionsQuery,
): Promise<TransactionSummary> {
  return apiRequest<TransactionSummary>({
    path: `/transactions/summary${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });
}

export async function getTransaction(
  workspaceId: string,
  transactionId: string,
): Promise<Transaction> {
  return apiRequest<Transaction>({
    path: `/transactions/${transactionId}`,
    auth: "required",
    workspaceId,
  });
}

export async function createTransaction(
  workspaceId: string,
  input: CreateTransactionInput,
) {
  return apiRequest<Transaction>({
    path: "/transactions",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function updateTransaction(
  workspaceId: string,
  transactionId: string,
  input: UpdateTransactionInput,
) {
  return apiRequest<Transaction>({
    path: `/transactions/${transactionId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function deleteTransaction(workspaceId: string, transactionId: string) {
  return apiRequest<{ success: true }>({
    path: `/transactions/${transactionId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}
