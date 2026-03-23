"use client";

import { useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Hash,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Pencil,
  Smile,
  Loader2,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Channel, Message, User } from "@/lib/chat/types";

interface MessageListProps {
  channel?: Channel;
  messages: Message[];
  currentUser?: User;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
}

function MessageItem({
  message,
  currentUser,
  showHeader,
  onDelete,
}: {
  message: Message;
  currentUser?: User;
  showHeader: boolean;
  onDelete?: (messageId: string) => void;
}) {
  const isOwnMessage = message.authorId === currentUser?.id;
  const isTemp = message.id.startsWith("temp-");

  return (
    <div
      className={`group flex gap-3 px-4 py-2 hover:bg-muted/50 ${
        isTemp ? "opacity-70" : ""
      }`}
    >
      {showHeader ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs">
            {message.author?.name?.slice(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="mb-0.5 flex items-center gap-2">
            <span className="font-medium text-sm">
              {message.author?.name || "Unknown User"}
            </span>
            <span className="text-muted-foreground text-xs">
              {format(new Date(message.createdAt), "MMM d, h:mm a")}
            </span>
            {message.editedAt && (
              <span className="text-muted-foreground text-xs">(edited)</span>
            )}
          </div>
        )}

        <div className="relative">
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>

          {isOwnMessage && !isTemp && (
            <div className="absolute right-0 top-0 hidden group-hover:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete?.(message.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageList({
  channel,
  messages,
  currentUser,
  isLoading,
  hasMore,
  onLoadMore,
  onDeleteMessage,
  onEditMessage,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "PUBLIC":
        return <Hash className="h-5 w-5" />;
      case "PRIVATE":
        return <Lock className="h-5 w-5" />;
      case "DM":
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Hash className="h-5 w-5" />;
    }
  };

  const formatTimestamp = (date?: string) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Group messages by author to show/hide headers
  const shouldShowHeader = (message: Message, index: number): boolean => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(prevMessage.createdAt).getTime();
    const isDifferentAuthor = message.authorId !== prevMessage.authorId;
    const isLongGap = timeDiff > 5 * 60 * 1000; // 5 minutes
    return isDifferentAuthor || isLongGap;
  };

  if (!channel) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center">
        <div className="rounded-full bg-muted p-4">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-medium text-lg">Select a channel</h3>
        <p className="text-muted-foreground">
          Choose a channel from the sidebar to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {getChannelIcon(channel.type)}
          </span>
          <h2 className="font-semibold">{channel.name}</h2>
          {channel.type !== "DM" && (
            <span className="text-muted-foreground text-sm">
              {channel.memberIds?.length || 0} members
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex min-h-full flex-col justify-end">
          {hasMore && (
            <div className="flex justify-center p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Load more messages
              </Button>
            </div>
          )}

          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-medium text-lg">
                No messages yet
              </h3>
              <p className="text-muted-foreground">
                Be the first to send a message in #{channel.name}
              </p>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  currentUser={currentUser}
                  showHeader={shouldShowHeader(message, index)}
                  onDelete={onDeleteMessage}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
