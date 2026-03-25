export enum ChannelType {
  PUBLIC = "public",
  PRIVATE = "private",
  DM = "dm",
}

export interface Channel {
  id: string;
  workspaceId?: string | null;
  type: ChannelType;
  name?: string;
  description?: string;
  memberIds: string[];
  unreadCount?: number;
  lastMessageId?: string;
  lastMessageAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  workspaceId?: string | null;
  authorId: string;
  content: string;
  mentionIds: string[];
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  lastReadMessageId?: string;
  lastReadAt?: string;
  unreadCount: number;
  joinedAt: string;
}

export interface ChatUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  status?: "online" | "away" | "offline";
}

export interface MessageAuthor {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

export interface CreateChannelInput {
  type: ChannelType;
  name?: string;
  description?: string;
  memberIds?: string[];
}

export interface SendMessageInput {
  channelId: string;
  content: string;
  mentionIds?: string[];
  tempId?: string;
}

export interface MarkReadInput {
  channelId: string;
  messageId: string;
}

export interface MessagesQuery {
  page?: number;
  limit?: number;
  channelId?: string;
  before?: string;
  after?: string;
}

export interface PaginatedMessages {
  items: Message[];
  total: number;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export interface UnreadSummary {
  totalUnread: number;
  channelUnreads: Array<{
    channelId: string;
    unreadCount: number;
    lastReadAt?: string;
  }>;
}

export type AutoDeletePreset = "off" | "1h" | "1d" | "7d" | "30d" | "custom";

export interface ChatConfig {
  id: string;
  workspaceId: string;
  autoDeletePreset: AutoDeletePreset;
  autoDeleteCustomSeconds: number | null;
  autoDeleteForAllUsers: boolean;
  notifyBeforeDeletion: boolean;
  autoDeleteSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateChatConfigInput {
  autoDeletePreset?: AutoDeletePreset;
  autoDeleteCustomSeconds?: number | null;
  autoDeleteForAllUsers?: boolean;
  notifyBeforeDeletion?: boolean;
}

// WebSocket events
export interface SocketMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  mentionIds: string[];
  createdAt: string;
  tempId?: string;
}

export interface TypingEvent {
  channelId: string;
  userId: string;
}
