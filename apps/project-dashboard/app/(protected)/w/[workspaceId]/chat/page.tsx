"use client";

import { useState, useEffect, useMemo } from "react";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { useAuth } from "@/hooks/use-auth";
import {
  useChannelsQuery,
  useChannelMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useMarkAsReadMutation,
} from "@/lib/chat/chat-query";
import { useChatSocket } from "@/lib/chat/use-chat-socket";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { toast } from "sonner";
import { SocketMessage } from "@/lib/chat/types";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/lib/chat/chat-query";

export default function ChatPage() {
  const { workspaceId } = useWorkspaceScope();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>();
  
  // Queries
  const { data: channels = [], isLoading: isLoadingChannels } = useChannelsQuery(workspaceId ?? "");
  
  const { 
    data: messagesData, 
    isLoading: isLoadingMessages 
  } = useChannelMessagesQuery(
    workspaceId ?? "", 
    selectedChannelId ?? "",
    {},
    Boolean(selectedChannelId)
  );

  const messages = useMemo(() => messagesData?.items ?? [], [messagesData?.items]);

  // Mutations
  const sendMessageMutation = useSendMessageMutation(workspaceId ?? "", selectedChannelId ?? "");
  const deleteMessageMutation = useDeleteMessageMutation(workspaceId ?? "");
  const markAsReadMutation = useMarkAsReadMutation(workspaceId ?? "");

  // Find selected channel object
  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId),
    [channels, selectedChannelId]
  );

  // Auto-select first channel if none selected
  useEffect(() => {
    if (!selectedChannelId && channels.length > 0 && channels[0]) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Real-time updates via Socket
  const { joinChannel, leaveChannel } = useChatSocket({
    workspaceId: workspaceId ?? "",
    onMessage: (message: SocketMessage) => {
      // Optimistically update or refetch
      if (message.channelId === selectedChannelId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(workspaceId ?? "", { channelId: selectedChannelId }),
        });
      }
      
      // Also update unread counts if it's not the active channel
      if (message.channelId !== selectedChannelId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.unreadSummary(workspaceId ?? ""),
        });
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Join/Leave channel socket rooms
  useEffect(() => {
    if (selectedChannelId) {
      joinChannel(selectedChannelId);
      
      // Mark as read when entering or messages update
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        markAsReadMutation.mutate({
          channelId: selectedChannelId,
          messageId: lastMessage.id,
        });
      }
      
      return () => {
        leaveChannel(selectedChannelId);
      };
    }
  }, [selectedChannelId, joinChannel, leaveChannel, messages, markAsReadMutation]);

  const handleSendMessage = async (content: string) => {
    if (!selectedChannelId) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        channelId: selectedChannelId,
        content,
      });
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleCreateChannel = async () => {
    // This could open a modal, but for now we'll just show a toast or placeholder logic
    toast.info("Create channel functionality coming soon!");
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageMutation.mutateAsync(messageId);
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const currentUser = authUser ? {
    id: authUser.id,
    displayName: authUser.displayName ?? "User",
  } : undefined;

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] overflow-hidden border rounded-xl bg-background shadow-sm mx-4 mb-4">
      <ChannelSidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={(channel) => setSelectedChannelId(channel.id)}
        onCreateChannel={handleCreateChannel}
        isLoading={isLoadingChannels}
      />
      
      <div className="flex flex-1 flex-col min-w-0">
        <MessageList
          channel={selectedChannel}
          messages={messages}
          currentUser={currentUser}
          isLoading={isLoadingMessages}
          onDeleteMessage={handleDeleteMessage}
        />
        
        {selectedChannelId && (
          <MessageInput
            channelId={selectedChannelId}
            onSendMessage={handleSendMessage}
            disabled={sendMessageMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
