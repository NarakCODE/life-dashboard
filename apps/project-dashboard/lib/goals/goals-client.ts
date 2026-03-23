import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client";
import type {
  CreateGoalInput,
  Goal,
  GoalsQuery,
  GoalsResponse,
  GoalsResponseData,
  LinkHabitsInput,
  LinkTasksInput,
  LogProgressInput,
  UpdateGoalInput,
} from "@/lib/goals/types";

function buildQueryString(query: GoalsQuery) {
  const params = new URLSearchParams();

  const entries = Object.entries(query) as Array<
    [keyof GoalsQuery, GoalsQuery[keyof GoalsQuery]]
  >;

  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getGoals(
  workspaceId: string,
  query: GoalsQuery,
): Promise<GoalsResponse> {
  const payload = await apiRequestEnvelope<
    GoalsResponseData,
    Record<string, unknown>
  >({
    path: `/goals${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  return {
    data: payload.data,
    meta: payload.meta ?? {},
  };
}

export async function getGoal(
  workspaceId: string,
  goalId: string,
): Promise<Goal> {
  return apiRequest<Goal>({
    path: `/goals/${goalId}`,
    auth: "required",
    workspaceId,
  });
}

export async function createGoal(workspaceId: string, input: CreateGoalInput) {
  return apiRequest<Goal>({
    path: "/goals",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function updateGoal(
  workspaceId: string,
  goalId: string,
  input: UpdateGoalInput,
) {
  return apiRequest<Goal>({
    path: `/goals/${goalId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function deleteGoal(workspaceId: string, goalId: string) {
  return apiRequest<{ success: true }>({
    path: `/goals/${goalId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}

export async function logProgress(
  workspaceId: string,
  goalId: string,
  input: LogProgressInput,
) {
  return apiRequest<Goal>({
    path: `/goals/${goalId}/log-progress`,
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function linkTasks(
  workspaceId: string,
  goalId: string,
  input: LinkTasksInput,
) {
  return apiRequest<Goal>({
    path: `/goals/${goalId}/link-tasks`,
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function unlinkTask(
  workspaceId: string,
  goalId: string,
  taskId: string,
) {
  return apiRequest<Goal>({
    path: `/goals/${goalId}/unlink-task/${taskId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}

export async function linkHabits(
  workspaceId: string,
  goalId: string,
  input: LinkHabitsInput,
) {
  return apiRequest<Goal>({
    path: `/goals/${goalId}/link-habits`,
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function unlinkHabit(
  workspaceId: string,
  goalId: string,
  habitId: string,
) {
  return apiRequest<Goal>({
    path: `/goals/${goalId}/unlink-habit/${habitId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}
