"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  InfoIcon,
  PhoneIcon,
  VideoIcon,
  Menu,
  MessageSquareDashed,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { useAuth } from "@/hooks/use-auth";
import type { WorkspaceMember } from "@/lib/workspaces/workspace-types";
import {
  useChannelsQuery,
  useDmsQuery,
  useChannelMessagesQuery,
  useMarkAsReadMutation,
  useCreateChannelMutation,
  useGetOrCreateDmMutation,
  useMarkAllAsReadMutation,
  chatKeys,
} from "@/lib/chat/chat-query";
import { useChatSocket } from "@/lib/chat/use-chat-socket";
import { ChatAutoDeleteSettings } from "@/components/chat/ChatAutoDeleteSettings";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { CreateChannelModal } from "@/components/chat/CreateChannelModal";
import { ConnectionStatus } from "@/components/chat/ConnectionStatus";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { toast } from "sonner";
import {
  SocketMessage,
  ChannelType,
  type CreateChannelInput,
  type Message,
  type Channel,
} from "@/lib/chat/types";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceQuery } from "@/lib/workspaces/workspace-query";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { QuickUserProfilePopover } from "@/components/users/quick-user-profile-popover";

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    ?.substring(0, 2)
    .toUpperCase() || "U";

type MessagesPayloadPage = {
  items?: Message[];
  data?: Message[];
};

export default function ChatsPage() {
  const { workspaceId } = useWorkspaceScope();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedChannelId, setSelectedChannelId] = useState<
    string | undefined
  >();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<ChannelType>(
    ChannelType.PUBLIC,
  );
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [pendingMessages, setPendingMessages] = useState<Map<string, Message>>(
    new Map(),
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: channelsRaw } = useChannelsQuery(workspaceId ?? "");
  const { data: dmsRaw } = useDmsQuery(workspaceId ?? "");
  const { data: workspace } = useWorkspaceQuery(workspaceId ?? "");
  const members = useMemo<WorkspaceMember[]>(
    () => workspace?.members || [],
    [workspace?.members],
  );

  // Extract channels safely
  const channels = useMemo(() => {
    if (!channelsRaw) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = channelsRaw as Record<string, any>;
    return Array.isArray(channelsRaw)
      ? channelsRaw
      : payload.items || payload.data || [];
  }, [channelsRaw]);

  const dms = useMemo(() => {
    if (!dmsRaw) return [];
    return Array.isArray(dmsRaw) ? dmsRaw : [];
  }, [dmsRaw]);

  const allChannels = useMemo<Channel[]>(
    () =>
      [...channels, ...dms].sort((left, right) => {
        const leftTime = left.lastMessageAt || left.updatedAt;
        const rightTime = right.lastMessageAt || right.updatedAt;
        return new Date(rightTime).getTime() - new Date(leftTime).getTime();
      }),
    [channels, dms],
  );

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
    const payload = messagesData as
      | {
          pages?: MessagesPayloadPage[];
          items?: Message[];
          data?: Message[];
        }
      | undefined;
    const items = payload?.pages
      ? payload.pages.flatMap((page) => page.items || page.data || [])
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

    return [...items, ...pending].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    );
  }, [messagesData, pendingMessages]);

  // Mutations
  const markAsReadMutation = useMarkAsReadMutation(workspaceId ?? "");
  const markAllAsReadMutation = useMarkAllAsReadMutation(workspaceId ?? "");
  const createChannelMutation = useCreateChannelMutation(workspaceId ?? "");
  const getOrCreateDmMutation = useGetOrCreateDmMutation(workspaceId ?? "");

  const selectedChannel = useMemo(
    () => allChannels.find((channel) => channel.id === selectedChannelId),
    [allChannels, selectedChannelId],
  );

  const totalUnreadCount = useMemo(() => {
    return allChannels.reduce(
      (sum: number, channel: Channel) => sum + (channel.unreadCount ?? 0),
      0,
    );
  }, [allChannels]);

  const lastMarkedMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedChannelId && messages.length > 0) {
      const lastConfirmedMessage = [...messages]
        .reverse()
        .find((msg) => !msg.id.startsWith("temp-"));

      if (
        lastConfirmedMessage &&
        lastMarkedMessageRef.current !== lastConfirmedMessage.id
      ) {
        lastMarkedMessageRef.current = lastConfirmedMessage.id;
        markAsReadMutation
          .mutateAsync({
            channelId: selectedChannelId,
            messageId: lastConfirmedMessage.id,
          })
          .catch(console.error);
      }
    }
  }, [selectedChannelId, messages, markAsReadMutation]);

  // Websocket Logic
  const {
    isConnected,
    isConnecting,
    connectionError,
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
      queryClient.invalidateQueries({
        queryKey: chatKeys.channels(workspaceId ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: chatKeys.dms(workspaceId ?? ""),
      });
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
      queryClient.invalidateQueries({
        queryKey: chatKeys.channels(workspaceId ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: chatKeys.dms(workspaceId ?? ""),
      });
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
    } else if (allChannels.length > 0) {
      setSelectedChannelId(allChannels[0]?.id);
    }
  }, [selectedChannelId, allChannels, joinChannel, leaveChannel]);

  useEffect(() => {
    // Autoscroll to bottom when new messages come in
    const timeout = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages.length, selectedChannelId]);

  const handleCreateChannel = async (data: CreateChannelInput) => {
    try {
      if (data.type === ChannelType.DM) {
        const targetUserId = data.memberIds?.[0];

        if (!targetUserId) {
          toast.error("Select a person to start a direct message");
          return;
        }

        const dmChannel = await getOrCreateDmMutation.mutateAsync(targetUserId);
        setSelectedChannelId(dmChannel.id);
        toast.success("Direct message ready");
      } else {
        const channel = await createChannelMutation.mutateAsync({
          type: data.type,
          name: data.name,
          description: data.description || undefined,
          memberIds: data.memberIds,
        });
        setSelectedChannelId(channel.id);
        toast.success("Channel created successfully");
      }
      setIsCreateModalOpen(false);
    } catch {
      toast.error(
        data.type === ChannelType.DM
          ? "Failed to start direct message"
          : "Failed to create channel",
      );
    }
  };

  const handleSelectChannel = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
    setIsSidebarOpen(false);
  }, []);

  const typingUserNames = useMemo(() => {
    const names: Record<string, string> = {};

    members.forEach((member) => {
      names[member.userId] = member.user.displayName;
    });

    return names;
  }, [members]);

  const selectedChannelDisplay = useMemo(() => {
    if (!selectedChannel) {
      return {
        title: "Channel",
        subtitle: "",
        avatarUrl: undefined as string | undefined,
        initials: "C",
      };
    }

    if (selectedChannel.type === ChannelType.DM) {
      const title = selectedChannel.otherUser?.displayName || "Direct message";
      return {
        title,
        subtitle: selectedChannel.otherUser?.email || "Direct message",
        avatarUrl: selectedChannel.otherUser?.avatarUrl,
        initials: initials(title),
      };
    }

    return {
      title: selectedChannel.name || "Channel",
      subtitle: isConnected ? "Connected" : "Reconnecting...",
      avatarUrl: undefined,
      initials: initials(selectedChannel.name || "C"),
    };
  }, [selectedChannel, isConnected]);

  // Helpers getting user mapping
  const getUserDisplayData = (authorId: string) => {
    const member = members.find((candidate) => candidate.userId === authorId);
    return {
      name: member?.user?.displayName || "User",
      img: member?.user?.avatarUrl || undefined,
      username: `@${member?.user?.displayName?.toLowerCase().replace(/\s/g, "") || "user"}`,
    };
  };

  const handleSendMessage = useCallback(
    async (content: string, tempId?: string) => {
      if (!selectedChannelId || !content.trim()) return;

      if (authUser && tempId) {
        const optimisticMessage: Message = {
          id: tempId,
          channelId: selectedChannelId,
          workspaceId: workspaceId ?? "",
          authorId: authUser.id,
          content: content.trim(),
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
        content.trim(),
        tempId,
      );

      if (!result.success) {
        toast.error(result.error || "Failed to send message");
        setPendingMessages((prev) => {
          const next = new Map(prev);
          next.delete(tempId as string);
          return next;
        });
        throw new Error(result.error || "Failed to send message");
      }
    },
    [selectedChannelId, authUser, workspaceId, sendWebSocketMessage],
  );

  return (
    <PageLayout>
      <div className="w-full max-w-5xl mx-auto flex border h-[calc(100vh-4rem)] rounded-xl overflow-hidden mt-4 shadow-sm bg-background">
        {/* Sidebar Panel for Desktop */}
        <div className="w-80 border-r bg-muted/10 hidden md:flex flex-col">
          <ChannelSidebar
            channels={allChannels}
            selectedChannelId={selectedChannelId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelectChannel={(channel: any) => handleSelectChannel(channel.id)}
            onCreateChannel={() => {
              setCreateModalType(ChannelType.PUBLIC);
              setIsCreateModalOpen(true);
            }}
            onCreateDm={() => {
              setCreateModalType(ChannelType.DM);
              setIsCreateModalOpen(true);
            }}
            onMarkAllAsRead={() => markAllAsReadMutation.mutateAsync()}
            isLoading={isLoadingMessages}
            totalUnreadCount={totalUnreadCount}
            className="flex-1 overflow-y-auto border-none bg-transparent"
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative">
          {selectedChannelId ? (
            <>
              {/* Header */}
              <div className="bg-background flex place-items-center justify-between border-b p-3">
                <div className="flex place-items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 shrink-0"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <Avatar className="bg-secondary">
                    {selectedChannelDisplay.avatarUrl ? (
                      <AvatarImage
                        src={selectedChannelDisplay.avatarUrl}
                        alt={selectedChannelDisplay.title}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedChannelDisplay.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">
                      {selectedChannelDisplay.title}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {selectedChannel?.type !== ChannelType.DM ? (
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            isConnected ? "bg-green-500" : "bg-red-500",
                          )}
                        />
                      ) : null}
                      {selectedChannelDisplay.subtitle}
                    </span>
                  </div>
                </div>
                <div className="flex place-items-center gap-1">
                  <ConnectionStatus
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    error={connectionError}
                  />
                  <ChatAutoDeleteSettings workspaceId={workspaceId ?? ""} />
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <PhoneIcon className="w-5 h-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <VideoIcon className="w-5 h-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <InfoIcon className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex flex-col overflow-y-auto flex-1 bg-muted/20">
                {isLoadingMessages && !messages.length ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="text-muted-foreground text-sm">
                      Loading messages...
                    </span>
                  </div>
                ) : (
                  <div className="flex min-h-full flex-col justify-end p-4 gap-4">
                    {isFetchingNextPage ? (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        Loading older messages...
                      </div>
                    ) : fetchNextPage ? (
                      <div className="text-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchNextPage()}
                          className="text-xs text-muted-foreground h-7"
                        >
                          Load older messages
                        </Button>
                      </div>
                    ) : null}

                    {messages.length > 0 ? (
                      messages.map((msg: Message) => {
                        const isSent = msg.authorId === authUser?.id;
                        const author = getUserDisplayData(msg.authorId);

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex gap-2 max-w-[85%] sm:max-w-[80%] w-full items-end",
                              isSent ? "ml-auto flex-row-reverse" : "",
                            )}
                          >
                            <QuickUserProfilePopover
                              userId={msg.authorId}
                              displayName={author.name}
                              avatarUrl={author.img}
                            >
                              <button
                                type="button"
                                className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                aria-label={`View ${author.name} profile`}
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarImage
                                    src={author.img}
                                    alt={author.username}
                                  />
                                  <AvatarFallback>
                                    {initials(author.name)}
                                  </AvatarFallback>
                                </Avatar>
                              </button>
                            </QuickUserProfilePopover>
                            <div
                              className={cn(
                                "flex flex-col gap-1 rounded-2xl p-3 max-w-[calc(100%-2.5rem)]",
                                isSent
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-background border shadow-sm rounded-bl-sm",
                              )}
                            >
                              <p className="text-sm wrap-break-word whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                              </p>
                              <div
                                className={cn(
                                  "w-full text-[10px] mt-1 shrink-0",
                                  isSent
                                    ? "text-right opacity-80"
                                    : "text-muted-foreground",
                                )}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                          <MessageSquareDashed className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">
                          No messages yet
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                          Start the conversation in{" "}
                          {selectedChannel?.name || "this channel"}.
                        </p>
                      </div>
                    )}

                    {typingUsers.size > 0 && (
                      <TypingIndicator
                        userIds={Array.from(typingUsers)}
                        userNames={typingUserNames}
                      />
                    )}

                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="border-t bg-background/80 backdrop-blur-sm p-3">
                <div className="max-w-4xl mx-auto space-y-2">
                  <MessageInput
                    channelId={selectedChannelId}
                    onSendMessage={handleSendMessage}
                    onStartTyping={() =>
                      selectedChannelId && startTyping(selectedChannelId)
                    }
                    onStopTyping={() =>
                      selectedChannelId && stopTyping(selectedChannelId)
                    }
                    disabled={!isConnected}
                    placeholder={`Message ${selectedChannelDisplay.title}`}
                  />
                </div>
              </div>
            </>
          ) : (
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
                className="mt-6 shadow-sm md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                Browse Channels
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col border-r">
          <SheetTitle className="sr-only">Channels</SheetTitle>
          <ChannelSidebar
            channels={allChannels}
            selectedChannelId={selectedChannelId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelectChannel={(channel: any) => handleSelectChannel(channel.id)}
            onCreateChannel={() => {
              setCreateModalType(ChannelType.PUBLIC);
              setIsCreateModalOpen(true);
            }}
            onCreateDm={() => {
              setCreateModalType(ChannelType.DM);
              setIsCreateModalOpen(true);
            }}
            onMarkAllAsRead={() => markAllAsReadMutation.mutateAsync()}
            isLoading={isLoadingMessages}
            totalUnreadCount={totalUnreadCount}
            className="flex-1 overflow-y-auto border-none"
          />
        </SheetContent>
      </Sheet>

      <CreateChannelModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateChannel}
        isPending={
          createChannelMutation.isPending || getOrCreateDmMutation.isPending
        }
        initialType={createModalType}
        members={members}
      />
    </PageLayout>
  );
}
