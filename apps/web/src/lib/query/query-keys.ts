export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    taskOverview: () => [...queryKeys.dashboard.all, 'task-overview'] as const,
  },
} as const;
