import { apiRequest } from "@/lib/api/api-client";
import type {
  Channel,
  CreateChannelInput,
  MarkReadInput,
  Message,
  MessagesQuery,
  PaginatedMessages,
  SendMessageInput,
  UnreadCountResponse,
  UnreadSummary,
} from "@/lib/chat/types";

function buildQueryString(query: MessagesQuery) {
  const params = new URLSearchParams();

  const entries = Object.entries(query) as Array<
    [keyof MessagesQuery, MessagesQuery[keyof MessagesQuery]]
  >;

  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getChannels(workspaceId: string): Promise<Channel[]> {
  return apiRequest<Channel[]>({
    path: "/chat/channels",
    auth: "required",
    workspaceId,
  });
}

export async function getChannel(
  workspaceId: string,
  channelId: string,
): Promise<Channel> {
  return apiRequest<Channel>({
    path: `/chat/channels/${channelId}`,
    auth: "required",
    workspaceId,
  });
}

export async function createChannel(
  workspaceId: string,
  input: CreateChannelInput,
): Promise<Channel> {
  return apiRequest<Channel>({
    path: "/chat/channels",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function getMessages(
  workspaceId: string,
  query: MessagesQuery,
): Promise<PaginatedMessages> {
  return apiRequest<PaginatedMessages>({
    path: `/chat/messages${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });
}

export async function getChannelMessages(
  workspaceId: string,
  channelId: string,
  query: Omit<MessagesQuery, "channelId">,
): Promise<PaginatedMessages> {
  return apiRequest<PaginatedMessages>({
    path: `/chat/channels/${channelId}/messages${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });
}

export async function sendMessage(
  workspaceId: string,
  input: SendMessageInput,
): Promise<Message> {
  return apiRequest<Message>({
    path: "/chat/messages",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function deleteMessage(
  workspaceId: string,
  messageId: string,
): Promise<void> {
  return apiRequest<void>({
    path: `/chat/messages/${messageId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}

export async function markAsRead(
  workspaceId: string,
  channelId: string,
  input: MarkReadInput,
): Promise<void> {
  return apiRequest<void>({
    path: `/chat/channels/${channelId}/read`,
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function markAllAsRead(
  workspaceId: string,
): Promise<{ markedCount: number }> {
  return apiRequest<{ markedCount: number }>({
    path: "/chat/read-all",
    method: "POST",
    auth: "required",
    workspaceId,
  });
}

export async function getUnreadCount(
  workspaceId: string,
): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>({
    path: "/chat/unread-count",
    auth: "required",
    workspaceId,
  });
}

export async function getUnreadSummary(
  workspaceId: string,
): Promise<UnreadSummary> {
  return apiRequest<UnreadSummary>({
    path: "/chat/unread-summary",
    auth: "required",
    workspaceId,
  });
}
