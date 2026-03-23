import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createChannel,
  deleteMessage,
  getChannel,
  getChannels,
  getChannelMessages,
  getUnreadCount,
  getUnreadSummary,
  markAllAsRead,
  markAsRead,
  sendMessage,
} from "@/lib/chat/chat-client";
import type {
  CreateChannelInput,
  MessagesQuery,
  SendMessageInput,
} from "@/lib/chat/types";

export const chatKeys = {
  all: (workspaceId: string) => ["workspace", workspaceId, "chat"] as const,
  channels: (workspaceId: string) =>
    [...chatKeys.all(workspaceId), "channels"] as const,
  channel: (workspaceId: string, channelId: string) =>
    [...chatKeys.all(workspaceId), "channel", channelId] as const,
  messages: (workspaceId: string, query: MessagesQuery) =>
    [...chatKeys.all(workspaceId), "messages", query] as const,
  unreadCount: (workspaceId: string) =>
    [...chatKeys.all(workspaceId), "unread-count"] as const,
  unreadSummary: (workspaceId: string) =>
    [...chatKeys.all(workspaceId), "unread-summary"] as const,
};

export function useChannelsQuery(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: chatKeys.channels(workspaceId),
    queryFn: () => getChannels(workspaceId),
    enabled: enabled && Boolean(workspaceId),
  });
}

export function useChannelQuery(
  workspaceId: string,
  channelId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: chatKeys.channel(workspaceId, channelId),
    queryFn: () => getChannel(workspaceId, channelId),
    enabled: enabled && Boolean(workspaceId) && Boolean(channelId),
  });
}

export function useChannelMessagesQuery(
  workspaceId: string,
  channelId: string,
  query: Omit<MessagesQuery, "channelId">,
  enabled = true,
) {
  return useQuery({
    queryKey: chatKeys.messages(workspaceId, { ...query, channelId }),
    queryFn: () => getChannelMessages(workspaceId, channelId, query),
    enabled: enabled && Boolean(workspaceId) && Boolean(channelId),
  });
}

export function useUnreadCountQuery(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: chatKeys.unreadCount(workspaceId),
    queryFn: () => getUnreadCount(workspaceId),
    enabled: enabled && Boolean(workspaceId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useUnreadSummaryQuery(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: chatKeys.unreadSummary(workspaceId),
    queryFn: () => getUnreadSummary(workspaceId),
    enabled: enabled && Boolean(workspaceId),
    refetchInterval: 30000,
  });
}

export function useCreateChannelMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChannelInput) => {
      if (!workspaceId) throw new Error("Workspace not available");
      return createChannel(workspaceId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.channels(workspaceId),
      });
    },
  });
}

export function useSendMessageMutation(
  workspaceId: string,
  channelId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => {
      if (!workspaceId) throw new Error("Workspace not available");
      return sendMessage(workspaceId, input);
    },
    onSuccess: () => {
      // Invalidate messages for this channel
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(workspaceId, { channelId }),
      });
      // Invalidate unread counts
      queryClient.invalidateQueries({
        queryKey: chatKeys.unreadCount(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: chatKeys.unreadSummary(workspaceId),
      });
    },
  });
}

export function useMarkAsReadMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      messageId,
    }: {
      channelId: string;
      messageId: string;
    }) => {
      if (!workspaceId) throw new Error("Workspace not available");
      return markAsRead(workspaceId, channelId, { messageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.unreadCount(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: chatKeys.unreadSummary(workspaceId),
      });
    },
  });
}

export function useMarkAllAsReadMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!workspaceId) throw new Error("Workspace not available");
      return markAllAsRead(workspaceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.unreadCount(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: chatKeys.unreadSummary(workspaceId),
      });
    },
  });
}

export function useDeleteMessageMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => {
      if (!workspaceId) throw new Error("Workspace not available");
      return deleteMessage(workspaceId, messageId);
    },
    onSuccess: () => {
      // Invalidate all message queries
      queryClient.invalidateQueries({
        queryKey: chatKeys.all(workspaceId),
      });
    },
  });
}
