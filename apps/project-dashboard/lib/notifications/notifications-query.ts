import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

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
  Notification,
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

export function useNotificationsInfiniteQuery(
  workspaceId: string,
  baseQuery: Omit<NotificationsQuery, "page">,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: [...notificationKeys.all(workspaceId), "infinite", baseQuery],
    queryFn: ({ pageParam }) =>
      getNotifications(workspaceId, { ...baseQuery, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
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
    onMutate: async ({ notificationId, isRead }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all(workspaceId),
      });

      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData<{
        data: Notification[];
        meta: { pagination: { total: number } };
      }>(notificationKeys.list(workspaceId, queryToInvalidate ?? {}));

      const previousUnreadCount = queryClient.getQueryData<{ count: number }>(
        notificationKeys.unreadCount(workspaceId),
      );

      // Optimistically update the notification
      if (previousNotifications) {
        queryClient.setQueryData<{
          data: Notification[];
          meta: { pagination: { total: number } };
        }>(notificationKeys.list(workspaceId, queryToInvalidate ?? {}), {
          ...previousNotifications,
          data: previousNotifications.data.map((n) =>
            n.id === notificationId
              ? { ...n, isRead, readAt: isRead ? new Date().toISOString() : null }
              : n,
          ),
        });
      }

      // Optimistically update unread count
      if (previousUnreadCount) {
        const countDelta = isRead ? -1 : 1;
        queryClient.setQueryData<{ count: number }>(
          notificationKeys.unreadCount(workspaceId),
          { count: Math.max(0, previousUnreadCount.count + countDelta) },
        );
      }

      // Return rollback context
      return { previousNotifications, previousUnreadCount };
    },
    onError: (_error, { notificationId }, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(workspaceId, queryToInvalidate ?? {}),
          context.previousNotifications,
        );
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(workspaceId),
          context.previousUnreadCount,
        );
      }
    },
    onSettled: async (_data, _error, { notificationId }) => {
      // Always refetch after error or success to ensure sync
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.detail(workspaceId, notificationId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(workspaceId),
      });
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
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all(workspaceId),
      });

      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData<{
        data: Notification[];
        meta: { pagination: { total: number } };
      }>(notificationKeys.list(workspaceId, queryToInvalidate ?? {}));

      const previousUnreadCount = queryClient.getQueryData<{ count: number }>(
        notificationKeys.unreadCount(workspaceId),
      );

      // Optimistically mark all as read
      if (previousNotifications) {
        queryClient.setQueryData<{
          data: Notification[];
          meta: { pagination: { total: number } };
        }>(notificationKeys.list(workspaceId, queryToInvalidate ?? {}), {
          ...previousNotifications,
          data: previousNotifications.data.map((n) =>
            !n.isRead
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n,
          ),
        });
      }

      // Set unread count to 0
      if (previousUnreadCount) {
        queryClient.setQueryData<{ count: number }>(
          notificationKeys.unreadCount(workspaceId),
          { count: 0 },
        );
      }

      // Return rollback context
      return { previousNotifications, previousUnreadCount };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(workspaceId, queryToInvalidate ?? {}),
          context.previousNotifications,
        );
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(workspaceId),
          context.previousUnreadCount,
        );
      }
    },
    onSettled: async () => {
      // Always refetch after error or success to ensure sync
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(workspaceId),
      });
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
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all(workspaceId),
      });

      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData<{
        data: Notification[];
        meta: { pagination: { total: number } };
      }>(notificationKeys.list(workspaceId, queryToInvalidate ?? {}));

      const previousUnreadCount = queryClient.getQueryData<{ count: number }>(
        notificationKeys.unreadCount(workspaceId),
      );

      // Optimistically remove from list
      if (previousNotifications) {
        const deletedNotification = previousNotifications.data.find(
          (n) => n.id === notificationId,
        );
        queryClient.setQueryData<{
          data: Notification[];
          meta: { pagination: { total: number } };
        }>(notificationKeys.list(workspaceId, queryToInvalidate ?? {}), {
          ...previousNotifications,
          data: previousNotifications.data.filter((n) => n.id !== notificationId),
          meta: {
            ...previousNotifications.meta,
            pagination: {
              ...previousNotifications.meta.pagination,
              total: Math.max(
                0,
                (previousNotifications.meta.pagination.total ?? 0) - 1,
              ),
            },
          },
        });

        // Update unread count if deleted was unread
        if (deletedNotification && !deletedNotification.isRead && previousUnreadCount) {
          queryClient.setQueryData<{ count: number }>(
            notificationKeys.unreadCount(workspaceId),
            { count: Math.max(0, previousUnreadCount.count - 1) },
          );
        }
      }

      // Remove detail cache
      queryClient.removeQueries({
        queryKey: notificationKeys.detail(workspaceId, notificationId),
      });

      // Return rollback context
      return { previousNotifications, previousUnreadCount };
    },
    onError: (_error, _notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(workspaceId, queryToInvalidate ?? {}),
          context.previousNotifications,
        );
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(workspaceId),
          context.previousUnreadCount,
        );
      }
    },
    onSettled: async () => {
      // Always refetch after error or success to ensure sync
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(workspaceId),
      });
    },
  });
}
