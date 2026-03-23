export enum HabitFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  CUSTOM = "custom",
}

export interface Habit {
  id: string;
  workspaceId?: string | null;
  userId: string;
  createdBy: string;
  updatedBy?: string | null;
  archivedBy?: string | null;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  customDays: number[];
  targetCount: number;
  color: string;
  status: "active" | "archived";
  startDate: string;
  endDate?: string | null;
  archivedAt?: string | null;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: "active" | "archived";
  frequency?: HabitFrequency;
}

export interface HabitsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HabitsResponseData {
  items: Habit[];
  pagination: HabitsPagination;
}

export interface HabitsResponse {
  data: HabitsResponseData;
  meta: Record<string, unknown>;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  frequency?: HabitFrequency;
  customDays?: number[];
  targetCount?: number;
  color?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateHabitInput {
  name?: string;
  description?: string;
  frequency?: HabitFrequency;
  customDays?: number[];
  targetCount?: number;
  color?: string;
  startDate?: string;
  endDate?: string;
}
