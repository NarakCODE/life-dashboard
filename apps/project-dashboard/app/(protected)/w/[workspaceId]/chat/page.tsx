"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { useAuth } from "@/hooks/use-auth";
import {
  useChannelsQuery,
  useChannelMessagesQuery,
  useDeleteMessageMutation,
  useMarkAsReadMutation,
  useCreateChannelMutation,
  useEditMessageMutation,
  useMarkAllAsReadMutation,
} from "@/lib/chat/chat-query";
import { useChatSocket } from "@/lib/chat/use-chat-socket";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { CreateChannelModal } from "@/components/chat/CreateChannelModal";
import { ConnectionStatus } from "@/components/chat/ConnectionStatus";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatAutoDeleteSettings } from "@/components/chat/ChatAutoDeleteSettings";
import { toast } from "sonner";
import {
  SocketMessage,
  type CreateChannelInput,
  type Message,
} from "@/lib/chat/types";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/lib/chat/chat-query";
import { useWorkspaceQuery } from "@/lib/workspaces/workspace-query";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Menu, MessageSquareDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/page-layout/PageLayout";

export default function ChatPage() {
  const { workspaceId } = useWorkspaceScope();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedChannelId, setSelectedChannelId] = useState<
    string | undefined
  >();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [pendingMessages, setPendingMessages] = useState<Map<string, Message>>(
    new Map(),
  );

  // Queries
  const { data: channelsRaw, isLoading: isLoadingChannels } = useChannelsQuery(
    workspaceId ?? "",
  );
  const { data: workspace } = useWorkspaceQuery(workspaceId ?? "");
  const members = useMemo(() => workspace?.members || [], [workspace?.members]);

  // FIX: Safely extract channels whether the API returns an array directly or an object like { items: [] }
  const channels = useMemo(() => {
    if (!channelsRaw) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = channelsRaw as Record<string, any>;
    return Array.isArray(channelsRaw)
      ? channelsRaw
      : payload.items || payload.data || [];
  }, [channelsRaw]);

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    isFetchingNextPage,
  } = useChannelMessagesQuery(
    workspaceId ?? "",
    selectedChannelId ?? "",
    {},
    Boolean(selectedChannelId),
  );

  const messages = useMemo(() => {
    // FIX: react-query infinite queries return data.pages, standard queries return data.items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = messagesData as Record<string, any> | undefined;
    const items = payload?.pages
      ? payload.pages.flatMap(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (page: Record<string, any>) => page.items || page.data || page || [],
        )
      : payload?.items || payload?.data || [];

    const confirmedIds = new Set(
      items
        .filter((msg: Message) => !msg.id.startsWith("temp-"))
        .map((msg: Message) => msg.id),
    );

    const confirmedTempIds = new Set(
      items
        .filter((msg: Message) => msg.id.startsWith("temp-"))
        .map((msg: Message) => msg.id),
    );

    const pending = Array.from(pendingMessages.values()).filter(
      (pendingMsg) => {
        if (confirmedIds.has(pendingMsg.id.replace("temp-", ""))) return false;
        if (confirmedTempIds.has(pendingMsg.id)) return false;
        return true;
      },
    );

    return [...items, ...pending];
  }, [messagesData, pendingMessages]);

  const hasNextPage = messagesData?.hasMore ?? false;

  // Mutations
  const deleteMessageMutation = useDeleteMessageMutation(workspaceId ?? "");
  const markAsReadMutation = useMarkAsReadMutation(workspaceId ?? "");
  const markAllAsReadMutation = useMarkAllAsReadMutation(workspaceId ?? "");
  const createChannelMutation = useCreateChannelMutation(workspaceId ?? "");
  const editMessageMutation = useEditMessageMutation(workspaceId ?? "");

  const selectedChannel = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => channels.find((c: Record<string, any>) => c.id === selectedChannelId),
    [channels, selectedChannelId],
  );

  const totalUnreadCount = useMemo(() => {
    return channels.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, channel: Record<string, any>) =>
        sum + (channel.unreadCount ?? 0),
      0,
    );
  }, [channels]);

  // 1. Add this ref at the top of your component alongside your other refs
  const lastMarkedMessageRef = useRef<string | null>(null);

  // 2. Replace the old useEffect with this one
  useEffect(() => {
    if (selectedChannelId && messages.length > 0) {
      // Find the last non-temp (server-confirmed) message
      const lastConfirmedMessage = [...messages]
        .reverse()
        .find((msg) => !msg.id.startsWith("temp-"));

      // Only fire the mutation if we haven't already marked THIS specific message as read
      if (
        lastConfirmedMessage &&
        lastMarkedMessageRef.current !== lastConfirmedMessage.id
      ) {
        lastMarkedMessageRef.current = lastConfirmedMessage.id;

        // Use .mutateAsync to prevent the mutation state object from triggering re-renders in the dependency array
        markAsReadMutation
          .mutateAsync({
            channelId: selectedChannelId,
            messageId: lastConfirmedMessage.id,
          })
          .catch(console.error);
      }
    }
    // We intentionally omit markAsReadMutation from the dependency array
    // to prevent React Query state changes from re-triggering this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId, messages.length]);

  const {
    isConnected,
    isConnecting,
    joinChannel,
    leaveChannel,
    sendMessage: sendWebSocketMessage,
    startTyping,
    stopTyping,
  } = useChatSocket({
    workspaceId: workspaceId ?? "",
    onMessage: (message: SocketMessage) => {
      if (message.tempId) {
        setPendingMessages((prev) => {
          const next = new Map(prev);
          next.delete(message.tempId!);
          return next;
        });
      }
      if (message.channelId === selectedChannelId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(workspaceId ?? "", {
            channelId: selectedChannelId,
          }),
        });
      }
      if (message.channelId !== selectedChannelId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.unreadSummary(workspaceId ?? ""),
        });
      }
    },
    onMessageSent: ({ tempId }) => {
      if (tempId) {
        setPendingMessages((prev) => {
          const next = new Map(prev);
          next.delete(tempId);
          return next;
        });
      }
      if (selectedChannelId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(workspaceId ?? "", {
            channelId: selectedChannelId,
          }),
        });
      }
    },
    onTypingStart: ({ userId, channelId }) => {
      if (channelId === selectedChannelId && userId !== authUser?.id) {
        setTypingUsers((prev) => new Set(prev).add(userId));
      }
    },
    onTypingStop: ({ userId, channelId }) => {
      if (channelId === selectedChannelId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    },
    onError: (error) => toast.error(error),
  });

  useEffect(() => {
    if (selectedChannelId) {
      joinChannel(selectedChannelId);
      return () => leaveChannel(selectedChannelId);
    }
  }, [selectedChannelId, joinChannel, leaveChannel]);

  const handleSendMessage = useCallback(
    async (content: string, tempId?: string) => {
      if (!selectedChannelId) return;

      if (tempId && authUser) {
        const optimisticMessage: Message = {
          id: tempId,
          channelId: selectedChannelId,
          workspaceId: workspaceId ?? "",
          authorId: authUser.id,
          content,
          mentionIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setPendingMessages((prev) =>
          new Map(prev).set(tempId, optimisticMessage),
        );
      }

      const result = await sendWebSocketMessage(
        selectedChannelId,
        content,
        tempId,
      );

      if (!result.success) {
        toast.error(result.error || "Failed to send message");
        if (tempId) {
          setPendingMessages((prev) => {
            const next = new Map(prev);
            next.delete(tempId);
            return next;
          });
        }
      }
    },
    [selectedChannelId, authUser, workspaceId, sendWebSocketMessage],
  );

  const handleCreateChannel = async (data: CreateChannelInput) => {
    try {
      await createChannelMutation.mutateAsync({
        type: data.type,
        name: data.name,
        description: data.description || undefined,
        memberIds: data.memberIds,
      });
      toast.success("Channel created successfully");
      setIsCreateModalOpen(false);
    } catch {
      toast.error("Failed to create channel");
    }
  };

  const handleSelectChannel = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
    setIsSidebarOpen(false);
  }, []);

  const currentUser = authUser
    ? { id: authUser.id, displayName: authUser.displayName ?? "User" }
    : undefined;

  const typingUserNames = useMemo(() => {
    const names: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members.forEach((member: Record<string, any>) => {
      names[member.userId] = member.user.displayName;
    });
    return names;
  }, [members]);

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background">
      <PageLayout className="flex flex-1 flex-col p-0 m-2 rounded-xl border-border/60 overflow-hidden min-h-0">
        <ResizablePanelGroup
          // @ts-expect-error type mismatches with strict html properties
          direction="horizontal"
          className="h-full w-full items-stretch"
        >
          {/* Desktop Sidebar Panel */}
          <ResizablePanel
            defaultSize={25}
            minSize={20}
            maxSize={40}
            className={cn("hidden lg:flex flex-col bg-muted/30 border-r")}
          >
            <ChannelSidebar
              channels={channels}
              selectedChannelId={selectedChannelId}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onSelectChannel={(channel: Record<string, any>) =>
                handleSelectChannel(channel.id)
              }
              onCreateChannel={() => setIsCreateModalOpen(true)}
              onMarkAllAsRead={() => markAllAsReadMutation.mutateAsync()}
              isLoading={isLoadingChannels}
              totalUnreadCount={totalUnreadCount}
              className="h-full w-full border-none"
            />
          </ResizablePanel>

          <ResizableHandle className="hidden lg:flex bg-border/50" withHandle />

          {/* Main Chat Area */}
          <ResizablePanel
            defaultSize={75}
            className="flex min-w-0 flex-1 flex-col overflow-hidden relative bg-background"
          >
            {/* Header - Fixed Height */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-6 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden -ml-2 h-9 w-9"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>

                {selectedChannel && (
                  <div className="flex flex-col">
                    <h1 className="text-base font-semibold leading-none">
                      {selectedChannel.name || "Chat"}
                    </h1>
                    {selectedChannel.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-50 hidden md:block">
                        {selectedChannel.description}
                      </p>
                    )}
                  </div>
                )}

                <Separator
                  orientation="vertical"
                  className="mx-2 h-6 hidden md:block"
                />

                <div className="flex items-center gap-2">
                  <ConnectionStatus
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    error={null}
                    className="h-7"
                  />
                  <ChatAutoDeleteSettings workspaceId={workspaceId ?? ""} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalUnreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutateAsync()}
                    className="text-xs h-8 text-muted-foreground hover:text-foreground"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </header>

            {selectedChannelId ? (
              <div className="flex flex-1 flex-col min-h-0 relative">
                <div className="flex-1 min-h-0">
                  <MessageList
                    channel={selectedChannel}
                    messages={messages}
                    currentUser={currentUser}
                    isLoading={isLoadingMessages}
                    hasMore={hasNextPage}
                    isLoadingMore={isFetchingNextPage}
                    onLoadMore={() => fetchNextPage()}
                    onDeleteMessage={(id: string) =>
                      deleteMessageMutation.mutateAsync(id)
                    }
                    onEditMessage={(id: string, content: string) =>
                      editMessageMutation.mutateAsync({
                        messageId: id,
                        content,
                      })
                    }
                    members={members}
                  />
                </div>

                <div className="shrink-0 p-4 border-t bg-background/50 backdrop-blur-sm">
                  <div className="max-w-4xl mx-auto space-y-2">
                    <TypingIndicator
                      userIds={Array.from(typingUsers)}
                      userNames={typingUserNames}
                    />
                    <MessageInput
                      channelId={selectedChannelId}
                      onSendMessage={handleSendMessage}
                      onStartTyping={() => startTyping(selectedChannelId)}
                      onStopTyping={() => stopTyping(selectedChannelId)}
                      disabled={!isConnected}
                    />
                  </div>
                </div>
              </div>
            ) : channels.length > 0 ? (
              // Channels exist — just none selected yet
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-muted/5 animate-in fade-in zoom-in duration-300">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mb-6">
                  <MessageSquareDashed className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  Select a Channel
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-75">
                  Pick a channel from the sidebar to start chatting with your
                  team.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 shadow-sm lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  Browse Channels
                </Button>
              </div>
            ) : (
              // No channels exist at all — prompt to create one
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-muted/5 animate-in fade-in zoom-in duration-300">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mb-6">
                  <MessageSquareDashed className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  Welcome to Chat
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-75">
                  No channels yet. Create your first channel to start
                  collaborating with your team.
                </p>
                <Button
                  className="mt-6 shadow-sm"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create New Channel
                </Button>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </PageLayout>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col border-r">
          <SheetTitle className="sr-only">Channels</SheetTitle>
          <ChannelSidebar
            channels={channels}
            selectedChannelId={selectedChannelId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelectChannel={(channel: Record<string, any>) =>
              handleSelectChannel(channel.id)
            }
            onCreateChannel={() => setIsCreateModalOpen(true)}
            onMarkAllAsRead={() => markAllAsReadMutation.mutateAsync()}
            isLoading={isLoadingChannels}
            totalUnreadCount={totalUnreadCount}
            className="flex-1 overflow-y-auto border-none"
          />
        </SheetContent>
      </Sheet>

      <CreateChannelModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateChannel}
        isPending={createChannelMutation.isPending}
        members={members}
      />
    </div>
  );
}
