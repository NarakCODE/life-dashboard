import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createGoal,
  deleteGoal,
  getGoal,
  getGoals,
  linkHabits,
  linkTasks,
  logProgress,
  unlinkHabit,
  unlinkTask,
  updateGoal,
} from "@/lib/goals/goals-client";
import type {
  CreateGoalInput,
  GoalsQuery,
  LinkHabitsInput,
  LinkTasksInput,
  LogProgressInput,
  UpdateGoalInput,
} from "@/lib/goals/types";

export const goalKeys = {
  all: (workspaceId: string) => ["workspace", workspaceId, "goals"] as const,
  list: (workspaceId: string, query: GoalsQuery) =>
    [...goalKeys.all(workspaceId), "list", query] as const,
  detail: (workspaceId: string, goalId: string) =>
    [...goalKeys.all(workspaceId), "detail", goalId] as const,
};

export function useGoalsQuery(
  workspaceId: string,
  query: GoalsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: goalKeys.list(workspaceId, query),
    queryFn: () => getGoals(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
  });
}

export function useGoalQuery(
  workspaceId: string,
  goalId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: goalKeys.detail(workspaceId, goalId),
    queryFn: () => getGoal(workspaceId, goalId),
    enabled: enabled && Boolean(workspaceId) && Boolean(goalId),
  });
}

export function useCreateGoalMutation(
  workspaceId: string,
  queryToInvalidate?: GoalsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return createGoal(workspaceId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: goalKeys.all(workspaceId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: goalKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useUpdateGoalMutation(
  workspaceId: string,
  queryToInvalidate?: GoalsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      input,
    }: {
      goalId: string;
      input: UpdateGoalInput;
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return updateGoal(workspaceId, goalId, input);
    },
    onSuccess: async (_data, { goalId }) => {
      await queryClient.invalidateQueries({
        queryKey: goalKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: goalKeys.detail(workspaceId, goalId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: goalKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useDeleteGoalMutation(
  workspaceId: string,
  queryToInvalidate?: GoalsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return deleteGoal(workspaceId, goalId);
    },
    onSuccess: async (_data, goalId) => {
      await queryClient.invalidateQueries({
        queryKey: goalKeys.all(workspaceId),
      });
      await queryClient.removeQueries({
        queryKey: goalKeys.detail(workspaceId, goalId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: goalKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useLogProgressMutation(
  workspaceId: string,
  queryToInvalidate?: GoalsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      input,
    }: {
      goalId: string;
      input: LogProgressInput;
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return logProgress(workspaceId, goalId, input);
    },
    onSuccess: async (_data, { goalId }) => {
      await queryClient.invalidateQueries({
        queryKey: goalKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: goalKeys.detail(workspaceId, goalId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: goalKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useLinkTasksMutation(
  workspaceId: string,
  queryToInvalidate?: GoalsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      input,
    }: {
      goalId: string;
      input: LinkTasksInput;
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return linkTasks(workspaceId, goalId, input);
    },
    onSuccess: async (_data, { goalId }) => {
      await queryClient.invalidateQueries({
        queryKey: goalKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: goalKeys.detail(workspaceId, goalId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: goalKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useUnlinkTaskMutation(
  workspaceId: string,
  queryToInvalidate?: GoalsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, taskId }: { goalId: string; taskId: string }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return unlinkTask(workspaceId, goalId, taskId);
    },
    onSuccess: async (_data, { goalId }) => {
      await queryClient.invalidateQueries({
        queryKey: goalKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: goalKeys.detail(workspaceId, goalId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: goalKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useLinkHabitsMutation(
  workspaceId: string,
  queryToInvalidate?: GoalsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      input,
    }: {
      goalId: string;
      input: LinkHabitsInput;
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return linkHabits(workspaceId, goalId, input);
    },
    onSuccess: async (_data, { goalId }) => {
      await queryClient.invalidateQueries({
        queryKey: goalKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: goalKeys.detail(workspaceId, goalId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: goalKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useUnlinkHabitMutation(
  workspaceId: string,
  queryToInvalidate?: GoalsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, habitId }: { goalId: string; habitId: string }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return unlinkHabit(workspaceId, goalId, habitId);
    },
    onSuccess: async (_data, { goalId }) => {
      await queryClient.invalidateQueries({
        queryKey: goalKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: goalKeys.detail(workspaceId, goalId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: goalKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}
