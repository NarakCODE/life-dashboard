"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  MoreHorizontal,
  Filter,
  Inbox,
  AlertCircle,
  Calendar,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageToolbar } from "@/components/page-layout";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import {
  useNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from "@/lib/notifications/notifications-query";
import {
  Notification,
  NotificationType,
  NOTIFICATION_TYPE_OPTIONS,
  getNotificationTypeIcon,
  getNotificationTypeLabel,
  getNotificationTypeColor,
} from "@/lib/notifications/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";

const FILTER_OPTIONS = [
  { id: "all", label: "All notifications" },
  { id: "unread", label: "Unread only" },
  { id: "read", label: "Read only" },
] as const;

function formatRelativeTime(dateString: string) {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (notification: Notification) => void;
  onMarkAsUnread: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
}) {
  const typeIcon = getNotificationTypeIcon(notification.type);
  const typeColor = getNotificationTypeColor(notification.type);

  const colorStyles: Record<string, { bg: string; border: string; icon: string }> = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
    gray: { bg: "bg-gray-50", border: "border-gray-200", icon: "text-gray-600" },
  };

  const style = colorStyles[typeColor] ?? colorStyles.gray;

  return (
    <Card
      className={cn(
        "border-border/60 transition-all hover:shadow-sm",
        notification.isRead ? "bg-background" : `${style?.bg ?? "bg-gray-50"} border-l-4`,
        !notification.isRead && `border-l-${typeColor}-500`
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg",
              style?.bg ?? "bg-gray-50",
              style?.border ?? "border-gray-200"
            )}
          >
            {typeIcon}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "truncate font-medium",
                      notification.isRead ? "text-foreground" : "font-semibold"
                    )}
                  >
                    {notification.title}
                  </h3>
                  {!notification.isRead && (
                    <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.body}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="muted" className="text-xs">
                    {getNotificationTypeLabel(notification.type)}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {notification.isRead ? (
                    <DropdownMenuItem onClick={() => onMarkAsUnread(notification)}>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Mark as unread
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onMarkAsRead(notification)}>
                      <Check className="mr-2 h-4 w-4" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(notification)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 shrink-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function NotificationsPage() {
  const auth = useAuth();
  const { workspaceId } = useWorkspaceScope();
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [deletingNotification, setDeletingNotification] = useState<Notification | undefined>();

  const query = useMemo(
    () => ({
      page: 1,
      limit: 50,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      ...(typeFilter !== "all" && { type: typeFilter }),
      ...(readFilter === "unread" && { isRead: false }),
      ...(readFilter === "read" && { isRead: true }),
    }),
    [readFilter, typeFilter]
  );

  const isQueryEnabled =
    auth.hasHydrated && auth.isAuthenticated && Boolean(workspaceId);

  const {
    data: notificationsData,
    isPending: isNotificationsPending,
    error: notificationsError,
  } = useNotificationsQuery(workspaceId ?? "", query, isQueryEnabled);

  const markAsReadMutation = useMarkAsReadMutation(workspaceId ?? "", query);
  const markAllAsReadMutation = useMarkAllAsReadMutation(workspaceId ?? "", query);
  const deleteNotificationMutation = useDeleteNotificationMutation(
    workspaceId ?? "",
    query
  );

  const notifications = notificationsData?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isEmpty = !isNotificationsPending && notifications.length === 0;

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await markAsReadMutation.mutateAsync({
        notificationId: notification.id,
        input: { isRead: true },
      });
      toast.success("Marked as read");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to mark as read"
      );
    }
  };

  const handleMarkAsUnread = async (notification: Notification) => {
    try {
      await markAsReadMutation.mutateAsync({
        notificationId: notification.id,
        input: { isRead: false },
      });
      toast.success("Marked as unread");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to mark as unread"
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to mark all as read"
      );
    }
  };

  const handleDeleteNotification = async () => {
    if (!deletingNotification) return;
    try {
      await deleteNotificationMutation.mutateAsync(deletingNotification.id);
      toast.success("Notification deleted");
      setDeletingNotification(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete notification"
      );
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      <PageHeader
        title="Notifications"
        actions={
          unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Mark all read
            </Button>
          )
        }
        toolbar={
          <PageToolbar
            left={
              <div className="flex items-center gap-2 flex-wrap">
                {/* Read Status Filter */}
                <Select
                  value={readFilter}
                  onValueChange={(value: "all" | "unread" | "read") =>
                    setReadFilter(value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select
                  value={typeFilter}
                  onValueChange={(value: "all" | NotificationType) =>
                    setTypeFilter(value)
                  }
                >
                  <SelectTrigger className="w-44">
                    <Bell className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {NOTIFICATION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <span className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {unreadCount > 0 && (
                  <Badge variant="secondary" className="h-8 px-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
            }
          />
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {isNotificationsPending && <NotificationsSkeleton />}

        {notificationsError && (
          <EmptyState
            title="Failed to load notifications"
            description="There was an error loading your notifications. Please try again."
            variant="border"
          />
        )}

        {isEmpty ? (
          <EmptyState
            title="No notifications"
            description={
              readFilter === "unread"
                ? "You have no unread notifications."
                : readFilter === "read"
                ? "You have no read notifications."
                : "You're all caught up! No notifications to show."
            }
            icon={Inbox}
            variant="border"
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onMarkAsUnread={handleMarkAsUnread}
                onDelete={setDeletingNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deletingNotification)}
        onOpenChange={(open) => !open && setDeletingNotification(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the notification &quot;{deletingNotification?.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteNotificationMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteNotificationMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteNotification();
              }}
            >
              {deleteNotificationMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
