import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  getJournalEntry,
  getMoodSummary,
  updateJournalEntry,
} from "@/lib/journal-entries/journal-entries-client"
import type {
  CreateJournalEntryInput,
  JournalEntriesQuery,
  MoodSummaryQuery,
  UpdateJournalEntryInput,
} from "@/lib/journal-entries/types"

const defaultStaleTime = 30_000
const defaultGcTime = 5 * 60_000

export const journalEntryKeys = {
  all: (workspaceId: string) =>
    ["workspace", workspaceId, "journal-entries"] as const,
  list: (workspaceId: string, query: JournalEntriesQuery) =>
    [...journalEntryKeys.all(workspaceId), "list", query] as const,
  detail: (workspaceId: string, entryId: string) =>
    [...journalEntryKeys.all(workspaceId), "detail", entryId] as const,
  moodSummary: (workspaceId: string, query: MoodSummaryQuery) =>
    [...journalEntryKeys.all(workspaceId), "mood-summary", query] as const,
}

export function useJournalEntriesQuery(
  workspaceId: string,
  query: JournalEntriesQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: journalEntryKeys.list(workspaceId, query),
    queryFn: () => getJournalEntries(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
    placeholderData: keepPreviousData,
  })
}

export function useJournalEntryQuery(
  workspaceId: string,
  entryId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: journalEntryKeys.detail(workspaceId, entryId),
    queryFn: () => getJournalEntry(workspaceId, entryId),
    enabled: enabled && Boolean(workspaceId) && Boolean(entryId),
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
  })
}

export function useMoodSummaryQuery(
  workspaceId: string,
  query: MoodSummaryQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: journalEntryKeys.moodSummary(workspaceId, query),
    queryFn: () => getMoodSummary(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
    staleTime: defaultStaleTime,
    gcTime: defaultGcTime,
    placeholderData: keepPreviousData,
  })
}

export function useCreateJournalEntryMutation(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateJournalEntryInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return createJournalEntry(workspaceId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: journalEntryKeys.all(workspaceId),
      })
    },
  })
}

export function useUpdateJournalEntryMutation(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      entryId,
      input,
    }: {
      entryId: string
      input: UpdateJournalEntryInput
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return updateJournalEntry(workspaceId, entryId, input)
    },
    onSuccess: async (_data, { entryId }) => {
      await queryClient.invalidateQueries({
        queryKey: journalEntryKeys.all(workspaceId),
      })
      await queryClient.invalidateQueries({
        queryKey: journalEntryKeys.detail(workspaceId, entryId),
      })
    },
  })
}

export function useDeleteJournalEntryMutation(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entryId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable")
      }

      return deleteJournalEntry(workspaceId, entryId)
    },
    onSuccess: async (_data, entryId) => {
      await queryClient.invalidateQueries({
        queryKey: journalEntryKeys.all(workspaceId),
      })
      await queryClient.removeQueries({
        queryKey: journalEntryKeys.detail(workspaceId, entryId),
      })
    },
  })
}
