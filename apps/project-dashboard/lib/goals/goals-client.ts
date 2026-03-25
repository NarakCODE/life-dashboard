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
  ProgressLog,
  UpdateGoalInput,
} from "@/lib/goals/types";

/**
 * Backend GoalResponseDto structure
 */
interface BackendGoal {
  id: string;
  workspaceId?: string | null;
  userId: string;
  title: string;
  description?: string;
  type: "manual" | "task-based" | "habit-based" | "mixed";
  targetValue: number;
  currentValue: number;
  unit?: string;
  dueDate?: string;
  status: "active" | "completed" | "archived";
  progressLogs: { value: number; note?: string; loggedAt: string }[];
  linkedTasks: string[];
  linkedHabits: string[];
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend GoalResponseDto to frontend Goal format
 */
function transformBackendGoal(goal: BackendGoal): Goal {
  return {
    ...goal,
    progressLogs: goal.progressLogs.map((log) => ({
      ...log,
      loggedAt: log.loggedAt,
    })),
  } as Goal;
}

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
    { items: BackendGoal[]; pagination: { total: number; page: number; limit: number; totalPages: number } },
    Record<string, unknown>
  >({
    path: `/goals${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  return {
    data: {
      items: payload.data.items.map(transformBackendGoal),
      pagination: payload.data.pagination,
    },
    meta: payload.meta ?? {},
  };
}

export async function getGoal(
  workspaceId: string,
  goalId: string,
): Promise<Goal> {
  const goal = await apiRequest<BackendGoal>({
    path: `/goals/${goalId}`,
    auth: "required",
    workspaceId,
  });
  return transformBackendGoal(goal);
}

export async function createGoal(workspaceId: string, input: CreateGoalInput) {
  const goal = await apiRequest<BackendGoal>({
    path: "/goals",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendGoal(goal);
}

export async function updateGoal(
  workspaceId: string,
  goalId: string,
  input: UpdateGoalInput,
) {
  const goal = await apiRequest<BackendGoal>({
    path: `/goals/${goalId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendGoal(goal);
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
  const goal = await apiRequest<BackendGoal>({
    path: `/goals/${goalId}/log-progress`,
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendGoal(goal);
}

export async function linkTasks(
  workspaceId: string,
  goalId: string,
  input: LinkTasksInput,
) {
  const goal = await apiRequest<BackendGoal>({
    path: `/goals/${goalId}/link-tasks`,
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendGoal(goal);
}

export async function unlinkTask(
  workspaceId: string,
  goalId: string,
  taskId: string,
) {
  const goal = await apiRequest<BackendGoal>({
    path: `/goals/${goalId}/unlink-task/${taskId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
  return transformBackendGoal(goal);
}

export async function linkHabits(
  workspaceId: string,
  goalId: string,
  input: LinkHabitsInput,
) {
  const goal = await apiRequest<BackendGoal>({
    path: `/goals/${goalId}/link-habits`,
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendGoal(goal);
}

export async function unlinkHabit(
  workspaceId: string,
  goalId: string,
  habitId: string,
) {
  const goal = await apiRequest<BackendGoal>({
    path: `/goals/${goalId}/unlink-habit/${habitId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
  return transformBackendGoal(goal);
}
