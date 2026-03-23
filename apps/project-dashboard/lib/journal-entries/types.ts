export enum MoodLevel {
  VERY_BAD = 1,
  BAD = 2,
  NEUTRAL = 3,
  GOOD = 4,
  VERY_GOOD = 5,
}

export interface JournalEntry {
  id: string
  workspaceId?: string | null
  userId: string
  authorUserId?: string | null
  updatedBy?: string | null
  entryDate: string
  title?: string
  content: string
  mood?: MoodLevel | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface JournalEntriesQuery {
  page?: number
  limit?: number
  sortBy?: "entryDate" | "createdAt" | "updatedAt"
  sortOrder?: "asc" | "desc"
  mood?: MoodLevel
  dateFrom?: string
  dateTo?: string
  tag?: string
  search?: string
}

export interface JournalEntriesPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface JournalEntriesResponseData {
  items: JournalEntry[]
  pagination: JournalEntriesPagination
}

export interface JournalEntriesResponse {
  data: JournalEntriesResponseData
  meta: Record<string, unknown>
}

export interface MoodCount {
  mood: MoodLevel
  label: string
  count: number
  percentage: number
}

export interface MoodTrendPoint {
  date: string
  avgMood: number
  entryCount: number
}

export interface MoodSummary {
  totalEntries: number
  entriesWithMood: number
  averageMood: number | null
  moodDistribution: MoodCount[]
  trend: MoodTrendPoint[]
  periodStart: string
  periodEnd: string
}

export interface MoodSummaryQuery {
  mood?: MoodLevel
  dateFrom?: string
  dateTo?: string
  tag?: string
  search?: string
}

export interface CreateJournalEntryInput {
  entryDate?: string
  title?: string
  content: string
  mood?: MoodLevel
  tags?: string[]
}

export interface UpdateJournalEntryInput {
  entryDate?: string
  title?: string
  content?: string
  mood?: MoodLevel
  tags?: string[]
}

export const MOOD_OPTIONS = [
  {
    value: MoodLevel.VERY_BAD,
    label: "Very Bad",
    shortLabel: "Very bad",
    emoji: "😞",
    accentClassName: "bg-rose-100 text-rose-700 border-rose-200",
    progressClassName: "bg-rose-500",
  },
  {
    value: MoodLevel.BAD,
    label: "Bad",
    shortLabel: "Bad",
    emoji: "🙁",
    accentClassName: "bg-orange-100 text-orange-700 border-orange-200",
    progressClassName: "bg-orange-500",
  },
  {
    value: MoodLevel.NEUTRAL,
    label: "Neutral",
    shortLabel: "Neutral",
    emoji: "😐",
    accentClassName: "bg-slate-100 text-slate-700 border-slate-200",
    progressClassName: "bg-slate-500",
  },
  {
    value: MoodLevel.GOOD,
    label: "Good",
    shortLabel: "Good",
    emoji: "🙂",
    accentClassName: "bg-emerald-100 text-emerald-700 border-emerald-200",
    progressClassName: "bg-emerald-500",
  },
  {
    value: MoodLevel.VERY_GOOD,
    label: "Very Good",
    shortLabel: "Very good",
    emoji: "😁",
    accentClassName: "bg-sky-100 text-sky-700 border-sky-200",
    progressClassName: "bg-sky-500",
  },
] as const
