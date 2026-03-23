export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export enum GoalType {
  MANUAL = "manual",
  TASK_BASED = "task-based",
  HABIT_BASED = "habit-based",
  MIXED = "mixed",
}

export interface ProgressLog {
  value: number;
  note?: string;
  loggedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  unit?: string;
  dueDate?: string;
  status: GoalStatus;
  progressLogs: ProgressLog[];
  progressPercent: number;
  linkedTasks?: string[];
  linkedHabits?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: GoalStatus;
  type?: GoalType;
}

export interface GoalsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GoalsResponseData {
  items: Goal[];
  pagination: GoalsPagination;
}

export interface GoalsResponse {
  data: GoalsResponseData;
  meta: Record<string, unknown>;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  targetValue: number;
  unit?: string;
  type?: GoalType;
  dueDate?: string;
  status?: GoalStatus;
  linkedTasks?: string[];
  linkedHabits?: string[];
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  type?: GoalType;
  dueDate?: string;
  status?: GoalStatus;
  currentValue?: number;
  linkedTasks?: string[];
  linkedHabits?: string[];
}

export interface LogProgressInput {
  value: number;
  note?: string;
}

export interface LinkTasksInput {
  taskIds: string[];
}

export interface LinkHabitsInput {
  habitIds: string[];
}
