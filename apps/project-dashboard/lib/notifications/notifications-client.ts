import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client";
import type {
  CreateNotificationInput,
  MarkAllAsReadResponse,
  MarkAsReadInput,
  Notification,
  NotificationsQuery,
  NotificationsResponse,
  UnreadCountResponse,
} from "@/lib/notifications/types";

interface RawNotificationsPage {
  data?: Notification[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

function isRawNotificationsPage(
  value: Notification[] | RawNotificationsPage,
): value is RawNotificationsPage {
  return !Array.isArray(value) && value !== null && typeof value === "object";
}

function buildQueryString(query: NotificationsQuery) {
  const params = new URLSearchParams();

  const entries = Object.entries(query) as Array<
    [keyof NotificationsQuery, NotificationsQuery[keyof NotificationsQuery]]
  >;

  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getNotifications(
  workspaceId: string,
  query: NotificationsQuery,
): Promise<NotificationsResponse> {
  const payload = await apiRequestEnvelope<
    Notification[] | RawNotificationsPage,
    { pagination: NotificationsResponse["meta"]["pagination"] }
  >({
    path: `/notifications${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  const wrappedPage = isRawNotificationsPage(payload.data) ? payload.data : null;
  const items =
    Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(wrappedPage?.data)
        ? wrappedPage.data
        : [];
  const fallbackLimit =
    query.limit ?? (items.length > 0 ? items.length : 20);
  const paginationFromBody = wrappedPage
    ? {
        total: wrappedPage?.total ?? items.length,
        page: wrappedPage?.page ?? query.page ?? 1,
        limit: wrappedPage?.limit ?? fallbackLimit,
        totalPages:
          wrappedPage?.totalPages ??
          Math.max(1, Math.ceil((wrappedPage?.total ?? items.length) / fallbackLimit)),
      }
    : undefined;

  return {
    data: items,
    meta: {
      pagination:
        payload.meta?.pagination ??
        paginationFromBody ?? {
          total: items.length,
          page: query.page ?? 1,
          limit: fallbackLimit,
          totalPages: 1,
        },
    },
  };
}

export async function getUnreadCount(
  workspaceId: string,
): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>({
    path: "/notifications/unread-count",
    auth: "required",
    workspaceId,
  });
}

export async function getNotification(
  workspaceId: string,
  notificationId: string,
): Promise<Notification> {
  return apiRequest<Notification>({
    path: `/notifications/${notificationId}`,
    auth: "required",
    workspaceId,
  });
}

export async function createNotification(
  workspaceId: string,
  input: CreateNotificationInput,
) {
  return apiRequest<Notification>({
    path: "/notifications",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function markAsRead(
  workspaceId: string,
  notificationId: string,
  input: MarkAsReadInput,
) {
  return apiRequest<Notification>({
    path: `/notifications/${notificationId}/read`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function markAllAsRead(
  workspaceId: string,
): Promise<MarkAllAsReadResponse> {
  return apiRequest<MarkAllAsReadResponse>({
    path: "/notifications/mark-all-read",
    method: "POST",
    auth: "required",
    workspaceId,
  });
}

export async function deleteNotification(
  workspaceId: string,
  notificationId: string,
) {
  return apiRequest<void>({
    path: `/notifications/${notificationId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}
