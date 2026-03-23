"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Bell } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getNotificationContextValues,
  getNotificationHref,
  getNotificationIcon,
  getNotificationTypeLabel,
} from "@/lib/notifications/notification-utils"
import {
  useMarkAllNotificationsReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from "@/lib/notifications/notifications-query"
import { buildWorkspacePath } from "@/lib/workspaces/workspace-routing"

interface NotificationsDropdownProps {
  workspaceId?: string | null
}

const recentNotificationsQuery = {
  page: 1,
  limit: 5,
  sortBy: "createdAt",
  sortOrder: "desc" as const,
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Unable to update notifications"
}

export function NotificationsDropdown({
  workspaceId,
}: NotificationsDropdownProps) {
  const isEnabled = Boolean(workspaceId)
  const listQuery = useNotificationsQuery(
    workspaceId ?? "",
    recentNotificationsQuery,
    isEnabled,
  )
  const unreadCountQuery = useUnreadNotificationCountQuery(
    workspaceId ?? "",
    isEnabled,
  )
  const markAllReadMutation = useMarkAllNotificationsReadMutation(
    workspaceId ?? "",
  )

  const notifications = listQuery.data?.data ?? []
  const unreadCount = unreadCountQuery.data?.count ?? 0
  const inboxHref = workspaceId ? buildWorkspacePath(workspaceId, "/inbox") : "#"

  async function handleMarkAllAsRead() {
    if (!workspaceId || unreadCount === 0) return

    try {
      const response = await markAllReadMutation.mutateAsync()
      toast.success(
        response.markedCount > 0
          ? `Marked ${response.markedCount} notifications as read`
          : "All notifications are already read",
      )
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-lg text-muted-foreground"
        >
          <Bell />
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 min-w-5 justify-center rounded-full px-1 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
          <span className="sr-only">Open notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[24rem] p-0" sideOffset={8}>
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Notifications</p>
              {unreadCount > 0 ? (
                <Badge variant="secondary" className="rounded-full px-2 text-[10px]">
                  {unreadCount} unread
                </Badge>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-md px-2 text-xs"
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
              onClick={() => void handleMarkAllAsRead()}
            >
              Mark all read
            </Button>
          </div>

          <div className="flex max-h-[24rem] flex-col overflow-y-auto">
            {listQuery.isPending ? (
              <div className="flex flex-col gap-3 p-4">
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
              </div>
            ) : null}

            {!listQuery.isPending && listQuery.isError ? (
              <div className="p-4 text-sm text-muted-foreground">
                Unable to load notifications.
              </div>
            ) : null}

            {!listQuery.isPending &&
            !listQuery.isError &&
            notifications.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : null}

            {!listQuery.isPending && !listQuery.isError
              ? notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  const href =
                    workspaceId &&
                    `${inboxHref}?notificationId=${encodeURIComponent(notification.id)}`
                  const contextValues = getNotificationContextValues(notification)

                  return (
                    <Link
                      key={notification.id}
                      href={href || getNotificationHref(notification, workspaceId) || inboxHref}
                      className="flex items-start gap-3 border-b border-border/30 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {notification.body}
                        </p>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="h-5 rounded-full px-2 text-[10px]"
                          >
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          {contextValues[0] ? (
                            <span className="truncate text-[10px] text-muted-foreground">
                              {contextValues[0]}
                            </span>
                          ) : null}
                          {!notification.isRead ? (
                            <span className="ml-auto size-2 rounded-full bg-primary" />
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  )
                })
              : null}
          </div>

          <div className="border-t border-border/50 p-2">
            <Button asChild variant="ghost" className="w-full justify-center rounded-lg">
              <Link href={inboxHref}>Open inbox</Link>
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
