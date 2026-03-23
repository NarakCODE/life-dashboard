export enum NotificationType {
  TASK_DUE = "task_due",
  HABIT_REMINDER = "habit_reminder",
  GOAL_MILESTONE = "goal_milestone",
  BUDGET_ALERT = "budget_alert",
  SYSTEM = "system",
}

export interface Notification {
  id: string;
  workspaceId?: string | null;
  userId: string;
  recipientUserId?: string | null;
  createdBy?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  type?: NotificationType;
  isRead?: boolean;
}

export interface NotificationsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    pagination: NotificationsPagination;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAsReadInput {
  isRead?: boolean;
}

export interface MarkAllAsReadResponse {
  markedCount: number;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const NOTIFICATION_TYPE_OPTIONS = [
  { id: NotificationType.TASK_DUE, label: "Task Due", icon: "📋", color: "blue" },
  { id: NotificationType.HABIT_REMINDER, label: "Habit Reminder", icon: "🔄", color: "purple" },
  { id: NotificationType.GOAL_MILESTONE, label: "Goal Milestone", icon: "🎯", color: "emerald" },
  { id: NotificationType.BUDGET_ALERT, label: "Budget Alert", icon: "💰", color: "amber" },
  { id: NotificationType.SYSTEM, label: "System", icon: "⚙️", color: "gray" },
] as const;

export function getNotificationTypeLabel(type: NotificationType) {
  return (
    NOTIFICATION_TYPE_OPTIONS.find((opt) => opt.id === type)?.label || type
  );
}

export function getNotificationTypeIcon(type: NotificationType) {
  return (
    NOTIFICATION_TYPE_OPTIONS.find((opt) => opt.id === type)?.icon || "📌"
  );
}

export function getNotificationTypeColor(type: NotificationType): string {
  switch (type) {
    case NotificationType.TASK_DUE:
      return "blue";
    case NotificationType.HABIT_REMINDER:
      return "purple";
    case NotificationType.GOAL_MILESTONE:
      return "emerald";
    case NotificationType.BUDGET_ALERT:
      return "amber";
    case NotificationType.SYSTEM:
    default:
      return "gray";
  }
}
