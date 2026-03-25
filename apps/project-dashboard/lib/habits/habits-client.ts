import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client";
import type {
  CreateHabitInput,
  Habit,
  HabitsQuery,
  HabitsResponse,
  HabitsResponseData,
  UpdateHabitInput,
} from "@/lib/habits/types";

/**
 * Backend HabitResponseDto structure
 */
interface BackendHabit {
  id: string;
  workspaceId?: string | null;
  userId: string;
  createdBy: string;
  updatedBy?: string | null;
  archivedBy?: string | null;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  customDays: number[];
  targetCount: number;
  color: string;
  status: "active" | "archived";
  startDate: string;
  endDate?: string | null;
  archivedAt?: string | null;
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend HabitResponseDto to frontend Habit format
 */
function transformBackendHabit(habit: BackendHabit): Habit {
  return {
    ...habit,
    startDate: habit.startDate,
    endDate: habit.endDate ?? null,
    archivedAt: habit.archivedAt ?? null,
  } as Habit;
}

function buildQueryString(query: HabitsQuery) {
  const params = new URLSearchParams();

  const entries = Object.entries(query) as Array<
    [keyof HabitsQuery, HabitsQuery[keyof HabitsQuery]]
  >;

  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getHabits(
  workspaceId: string,
  query: HabitsQuery,
): Promise<HabitsResponse> {
  const payload = await apiRequestEnvelope<
    { items: BackendHabit[]; pagination: { total: number; page: number; limit: number; totalPages: number } },
    Record<string, unknown>
  >({
    path: `/habits${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  return {
    data: {
      items: payload.data.items.map(transformBackendHabit),
      pagination: payload.data.pagination,
    },
    meta: payload.meta ?? {},
  };
}

export async function getHabit(
  workspaceId: string,
  habitId: string,
): Promise<Habit> {
  const habit = await apiRequest<BackendHabit>({
    path: `/habits/${habitId}`,
    auth: "required",
    workspaceId,
  });
  return transformBackendHabit(habit);
}

export async function createHabit(
  workspaceId: string,
  input: CreateHabitInput,
) {
  const habit = await apiRequest<BackendHabit>({
    path: "/habits",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendHabit(habit);
}

export async function updateHabit(
  workspaceId: string,
  habitId: string,
  input: UpdateHabitInput,
) {
  const habit = await apiRequest<BackendHabit>({
    path: `/habits/${habitId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendHabit(habit);
}

export async function archiveHabit(workspaceId: string, habitId: string) {
  const habit = await apiRequest<BackendHabit>({
    path: `/habits/${habitId}/archive`,
    method: "PATCH",
    auth: "required",
    workspaceId,
  });
  return transformBackendHabit(habit);
}

export async function deleteHabit(workspaceId: string, habitId: string) {
  return apiRequest<{ success: true }>({
    path: `/habits/${habitId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}
