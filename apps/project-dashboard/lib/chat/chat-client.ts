import { apiRequest } from "@/lib/api/api-client";
import type {
  Channel,
  ChatUser,
  CreateChannelInput,
  MarkReadInput,
  Message,
  MessagesQuery,
  PaginatedMessages,
  SendMessageInput,
  UnreadCountResponse,
  UnreadSummary,
  ChatConfig,
  UpdateChatConfigInput,
} from "@/lib/chat/types";

/**
 * Backend ChannelResponseDto structure
 */
interface BackendChannel {
  id: string;
  workspaceId?: string | null;
  type: "public" | "private" | "dm";
  name?: string;
  description?: string;
  memberIds: string[];
  unreadCount?: number;
  lastMessageId?: string | null;
  lastMessageAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  otherUser?: ChatUser;
}

/**
 * Backend MessageResponseDto structure
 */
interface BackendMessage {
  id: string;
  channelId: string;
  workspaceId?: string | null;
  authorId: string;
  content: string;
  mentionIds: string[];
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend ChannelResponseDto to frontend Channel format
 */
function transformBackendChannel(channel: BackendChannel): Channel {
  return {
    ...channel,
    lastMessageAt: channel.lastMessageAt ?? undefined,
  } as Channel;
}

/**
 * Transform backend MessageResponseDto to frontend Message format
 */
function transformBackendMessage(message: BackendMessage): Message {
  return {
    ...message,
    editedAt: message.editedAt ?? undefined,
    deletedAt: message.deletedAt ?? undefined,
  } as Message;
}

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
  const channels = await apiRequest<BackendChannel[]>({
    path: "/chat/channels",
    auth: "required",
    workspaceId,
  });
  return channels.map(transformBackendChannel);
}

export async function getDms(workspaceId: string): Promise<Channel[]> {
  const channels = await apiRequest<BackendChannel[]>({
    path: "/chat/dms",
    auth: "required",
    workspaceId,
  });
  return channels.map(transformBackendChannel);
}

export async function getChannel(
  workspaceId: string,
  channelId: string,
): Promise<Channel> {
  const channel = await apiRequest<BackendChannel>({
    path: `/chat/channels/${channelId}`,
    auth: "required",
    workspaceId,
  });
  return transformBackendChannel(channel);
}

export async function createChannel(
  workspaceId: string,
  input: CreateChannelInput,
): Promise<Channel> {
  const channel = await apiRequest<BackendChannel>({
    path: "/chat/channels",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendChannel(channel);
}

export async function getOrCreateDm(
  workspaceId: string,
  userId: string,
): Promise<Channel> {
  const channel = await apiRequest<BackendChannel>({
    path: `/chat/dms/${userId}`,
    method: "POST",
    auth: "required",
    workspaceId,
  });
  return transformBackendChannel(channel);
}

export async function getMessages(
  workspaceId: string,
  query: MessagesQuery,
): Promise<PaginatedMessages> {
  const result = await apiRequest<{
    items: BackendMessage[];
    total: number;
    hasMore: boolean;
  }>({
    path: `/chat/messages${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });
  return {
    items: result.items.map(transformBackendMessage),
    total: result.total,
    hasMore: result.hasMore,
  };
}

export async function getChannelMessages(
  workspaceId: string,
  channelId: string,
  query: Omit<MessagesQuery, "channelId">,
): Promise<PaginatedMessages> {
  const result = await apiRequest<{
    items: BackendMessage[];
    total: number;
    hasMore: boolean;
  }>({
    path: `/chat/channels/${channelId}/messages${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });
  return {
    items: result.items.map(transformBackendMessage),
    total: result.total,
    hasMore: result.hasMore,
  };
}

export async function sendMessage(
  workspaceId: string,
  input: SendMessageInput,
): Promise<Message> {
  const message = await apiRequest<BackendMessage>({
    path: "/chat/messages",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendMessage(message);
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

export async function editMessage(
  workspaceId: string,
  messageId: string,
  content: string,
): Promise<Message> {
  const message = await apiRequest<BackendMessage>({
    path: `/chat/messages/${messageId}`,
    method: "PATCH",
    body: { content },
    auth: "required",
    workspaceId,
  });
  return transformBackendMessage(message);
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

export async function getChatConfig(
  workspaceId: string,
): Promise<ChatConfig> {
  return apiRequest<ChatConfig>({
    path: "/chat/config",
    auth: "required",
    workspaceId,
  });
}

export async function updateChatConfig(
  workspaceId: string,
  input: UpdateChatConfigInput,
): Promise<ChatConfig> {
  return apiRequest<ChatConfig>({
    path: "/chat/config",
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  });
}
