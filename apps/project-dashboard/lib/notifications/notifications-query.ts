import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createNotification,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/notifications/notifications-client";
import type {
  CreateNotificationInput,
  MarkAsReadInput,
  NotificationsQuery,
} from "@/lib/notifications/types";

export const notificationKeys = {
  all: (workspaceId: string) =>
    ["workspace", workspaceId, "notifications"] as const,
  list: (workspaceId: string, query: NotificationsQuery) =>
    [...notificationKeys.all(workspaceId), "list", query] as const,
  detail: (workspaceId: string, notificationId: string) =>
    [...notificationKeys.all(workspaceId), "detail", notificationId] as const,
  unreadCount: (workspaceId: string) =>
    [...notificationKeys.all(workspaceId), "unread-count"] as const,
};

export function useNotificationsQuery(
  workspaceId: string,
  query: NotificationsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: notificationKeys.list(workspaceId, query),
    queryFn: () => getNotifications(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
  });
}

export function useUnreadCountQuery(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(workspaceId),
    queryFn: () => getUnreadCount(workspaceId),
    enabled: enabled && Boolean(workspaceId),
    // Refresh unread count every 30 seconds
    refetchInterval: 30000,
  });
}

// Alias for compatibility with existing code
export const useUnreadNotificationCountQuery = useUnreadCountQuery;

export function useCreateNotificationMutation(
  workspaceId: string,
  queryToInvalidate?: NotificationsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNotificationInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return createNotification(workspaceId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: notificationKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useMarkAsReadMutation(
  workspaceId: string,
  queryToInvalidate?: NotificationsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      input,
    }: {
      notificationId: string;
      input: MarkAsReadInput;
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return markAsRead(workspaceId, notificationId, input);
    },
    onSuccess: async (_data, { notificationId }) => {
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.detail(workspaceId, notificationId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(workspaceId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: notificationKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

// Compatibility version that accepts isRead directly (for existing InboxPage)
export function useMarkNotificationReadMutation(
  workspaceId: string,
  queryToInvalidate?: NotificationsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      isRead,
    }: {
      notificationId: string;
      isRead: boolean;
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return markAsRead(workspaceId, notificationId, { isRead });
    },
    onSuccess: async (_data, { notificationId }) => {
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.detail(workspaceId, notificationId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(workspaceId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: notificationKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

export function useMarkAllAsReadMutation(
  workspaceId: string,
  queryToInvalidate?: NotificationsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return markAllAsRead(workspaceId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(workspaceId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: notificationKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}

// Alias for compatibility with existing code
export const useMarkAllNotificationsReadMutation = useMarkAllAsReadMutation;

export function useDeleteNotificationMutation(
  workspaceId: string,
  queryToInvalidate?: NotificationsQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return deleteNotification(workspaceId, notificationId);
    },
    onSuccess: async (_data, notificationId) => {
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
      await queryClient.removeQueries({
        queryKey: notificationKeys.detail(workspaceId, notificationId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(workspaceId),
      });
      if (queryToInvalidate) {
        await queryClient.invalidateQueries({
          queryKey: notificationKeys.list(workspaceId, queryToInvalidate),
        });
      }
    },
  });
}
