import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client";
import type {
  CreateHabitInput,
  Habit,
  HabitsQuery,
  HabitsResponse,
  HabitsResponseData,
  UpdateHabitInput,
} from "@/lib/habits/types";

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
    HabitsResponseData,
    Record<string, unknown>
  >({
    path: `/habits${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  return {
    data: payload.data,
    meta: payload.meta ?? {},
  };
}

export async function getHabit(
  workspaceId: string,
  habitId: string,
): Promise<Habit> {
  return apiRequest<Habit>({
    path: `/habits/${habitId}`,
    auth: "required",
    workspaceId,
  });
}

export async function createHabit(
  workspaceId: string,
  input: CreateHabitInput,
) {
  return apiRequest<Habit>({
    path: "/habits",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function updateHabit(
  workspaceId: string,
  habitId: string,
  input: UpdateHabitInput,
) {
  return apiRequest<Habit>({
    path: `/habits/${habitId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function archiveHabit(workspaceId: string, habitId: string) {
  return apiRequest<Habit>({
    path: `/habits/${habitId}/archive`,
    method: "PATCH",
    auth: "required",
    workspaceId,
  });
}

export async function deleteHabit(workspaceId: string, habitId: string) {
  return apiRequest<{ success: true }>({
    path: `/habits/${habitId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}
