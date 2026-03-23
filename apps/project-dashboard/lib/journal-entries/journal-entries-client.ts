import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client"
import type {
  CreateJournalEntryInput,
  JournalEntry,
  JournalEntriesPagination,
  JournalEntriesQuery,
  JournalEntriesResponse,
  MoodSummary,
  MoodSummaryQuery,
  UpdateJournalEntryInput,
} from "@/lib/journal-entries/types"

interface RawJournalEntriesPagination {
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

interface RawJournalEntriesResponseData {
  items?: JournalEntry[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
  pagination?: RawJournalEntriesPagination
}

function buildQueryString<T extends object>(query: T) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue
    params.set(key, String(value))
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

function normalizePagination(
  raw: RawJournalEntriesResponseData,
  query: JournalEntriesQuery,
  fallbackItemCount: number,
): JournalEntriesPagination {
  const rawPagination =
    raw.pagination && typeof raw.pagination === "object" ? raw.pagination : {}

  const page =
    Number(rawPagination.page ?? raw.page ?? query.page ?? 1) || query.page || 1
  const limit =
    Number(rawPagination.limit ?? raw.limit ?? query.limit ?? 20) ||
    query.limit ||
    20
  const total =
    Number(rawPagination.total ?? raw.total ?? fallbackItemCount) ||
    fallbackItemCount
  const totalPages =
    Number(rawPagination.totalPages ?? raw.totalPages ?? Math.ceil(total / limit)) ||
    Math.ceil(total / limit)

  return {
    total,
    page,
    limit,
    totalPages,
  }
}

export async function getJournalEntries(
  workspaceId: string,
  query: JournalEntriesQuery,
): Promise<JournalEntriesResponse> {
  const payload = await apiRequestEnvelope<RawJournalEntriesResponseData>({
    path: `/journal-entries${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })

  const rawData =
    payload.data && typeof payload.data === "object" ? payload.data : {}
  const items = Array.isArray(rawData.items) ? (rawData.items as JournalEntry[]) : []

  return {
    data: {
      items,
      pagination: normalizePagination(rawData, query, items.length),
    },
    meta: payload.meta ?? {},
  }
}

export function getJournalEntry(workspaceId: string, entryId: string) {
  return apiRequest<JournalEntry>({
    path: `/journal-entries/${entryId}`,
    auth: "required",
    workspaceId,
  })
}

export function getMoodSummary(
  workspaceId: string,
  query: MoodSummaryQuery,
) {
  return apiRequest<MoodSummary>({
    path: `/journal-entries/mood-summary${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  })
}

export function createJournalEntry(
  workspaceId: string,
  input: CreateJournalEntryInput,
) {
  return apiRequest<JournalEntry>({
    path: "/journal-entries",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export function updateJournalEntry(
  workspaceId: string,
  entryId: string,
  input: UpdateJournalEntryInput,
) {
  return apiRequest<JournalEntry>({
    path: `/journal-entries/${entryId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  })
}

export function deleteJournalEntry(workspaceId: string, entryId: string) {
  return apiRequest<{ success: true }>({
    path: `/journal-entries/${entryId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  })
}
