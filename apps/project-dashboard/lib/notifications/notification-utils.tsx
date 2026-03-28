import {
  Bell,
  ChartLineUp,
  CheckCircle,
  CurrencyDollar,
  Target,
  UserCircle,
  ChatCircleText,
  Envelope,
  ChatTeardropText,
  At,
} from "@phosphor-icons/react/dist/ssr"

import type { Notification, NotificationType } from "@/lib/notifications/types"
import { buildWorkspacePath } from "@/lib/workspaces/workspace-routing"

const notificationLabels: Record<NotificationType, string> = {
  task_assigned: "Task Assigned",
  task_due: "Task",
  habit_reminder: "Habit",
  goal_milestone: "Goal",
  budget_alert: "Budget",
  project_mention: "Mention",
  chat_message: "Chat",
  workspace_invitation: "Invitation",
  comment_reply: "Reply",
  system: "System",
}

const notificationIcons: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  task_assigned: UserCircle,
  task_due: CheckCircle,
  habit_reminder: Target,
  goal_milestone: ChartLineUp,
  budget_alert: CurrencyDollar,
  project_mention: At,
  chat_message: ChatCircleText,
  workspace_invitation: Envelope,
  comment_reply: ChatTeardropText,
  system: Bell,
}

export function getNotificationTypeLabel(type: NotificationType) {
  return notificationLabels[type] ?? "Update"
}

export function getNotificationIcon(type: NotificationType) {
  return notificationIcons[type] ?? Bell
}

export function getNotificationHref(
  notification: Notification,
  workspaceId?: string | null,
) {
  const rawPath = [
    notification.data.href,
    notification.data.path,
    notification.data.url,
    notification.data.route,
  ].find((value): value is string => typeof value === "string" && value.length > 0)

  if (!rawPath) {
    return null
  }

  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return rawPath
  }

  if (rawPath.startsWith("/w/")) {
    return rawPath
  }

  if (rawPath.startsWith("/") && workspaceId) {
    return buildWorkspacePath(workspaceId, rawPath)
  }

  return rawPath
}

export function getNotificationContextValues(notification: Notification) {
  const candidateKeys = [
    "clientName",
    "projectName",
    "taskName",
    "habitName",
    "goalName",
    "budgetName",
    "workspaceName",
    "entityLabel",
    "resourceName",
  ] as const

  return candidateKeys
    .map((key) => notification.data[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0)
}
