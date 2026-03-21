import { apiClient } from '@/lib/api/core/api-client';

export interface TaskOverview {
  totalTasks: number;
  countsByStatus: {
    todo: number;
    in_progress: number;
    done: number;
    archived: number;
  };
  overdueCount: number;
  upcomingCount: number;
  completedSummary: {
    total: number;
    latest: string | null;
  };
}

export const dashboardApi = {
  getTaskOverview() {
    return apiClient.get<TaskOverview>('/dashboard/tasks-overview');
  },
};
