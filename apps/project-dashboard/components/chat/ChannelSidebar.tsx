"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AtSign,
  Hash,
  Lock,
  MessageCircle,
  Plus,
  Search,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChannelType, type Channel } from "@/lib/chat/types";

interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannelId?: string;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel?: () => void;
  onCreateDm?: () => void;
  onMarkAllAsRead?: () => void;
  isLoading?: boolean;
  totalUnreadCount?: number;
  className?: string;
}

interface ChannelItemProps {
  channel: Channel;
}

export function ChannelSidebar({
  channels,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onCreateDm,
  onMarkAllAsRead,
  isLoading,
  totalUnreadCount = 0,
  className,
}: ChannelSidebarProps) {
  const [search, setSearch] = useState("");

  const filteredChannels = channels.filter((channel) => {
    const searchLower = search.toLowerCase();
    const name = channel.name?.toLowerCase() || "";
    const otherUserName = channel.otherUser?.displayName?.toLowerCase() || "";
    const otherUserEmail = channel.otherUser?.email?.toLowerCase() || "";
    return (
      name.includes(searchLower) ||
      otherUserName.includes(searchLower) ||
      otherUserEmail.includes(searchLower)
    );
  });

  const publicChannels = filteredChannels.filter(
    (channel) => channel.type === ChannelType.PUBLIC,
  );
  const privateChannels = filteredChannels.filter(
    (channel) => channel.type === ChannelType.PRIVATE,
  );
  const dmChannels = filteredChannels.filter(
    (channel) => channel.type === ChannelType.DM,
  );

  const getChannelIcon = (type: Channel["type"]) => {
    switch (type) {
      case ChannelType.PUBLIC:
        return <Hash className="h-4 w-4" />;
      case ChannelType.PRIVATE:
        return <Lock className="h-4 w-4" />;
      case ChannelType.DM:
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (date?: string) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getChannelLabel = (channel: Channel) => {
    if (channel.type === ChannelType.DM) {
      return channel.otherUser?.displayName || "Direct message";
    }
    return channel.name || "Unnamed channel";
  };

  const getChannelSecondaryText = (channel: Channel) => {
    if (channel.type === ChannelType.DM) {
      return channel.otherUser?.email || "";
    }
    return "";
  };

  const getInitials = (value: string) =>
    value
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const ChannelItem = ({ channel }: ChannelItemProps) => {
    const isSelected = selectedChannelId === channel.id;
    const unreadCount = channel.unreadCount ?? 0;
    const label = getChannelLabel(channel);
    const secondaryText = getChannelSecondaryText(channel);

    return (
      <button
        onClick={() => onSelectChannel(channel)}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
          isSelected
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50"
        } ${unreadCount ? "font-medium" : ""}`}
      >
        {channel.type === ChannelType.DM ? (
          <Avatar className="size-8 shrink-0">
            <AvatarImage
              src={channel.otherUser?.avatarUrl}
              alt={channel.otherUser?.displayName}
            />
            <AvatarFallback className="text-[11px]">
              {getInitials(label)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-muted-foreground shrink-0">
            {getChannelIcon(channel.type)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate">{label}</div>
          {secondaryText ? (
            <div className="truncate text-xs font-normal text-muted-foreground">
              {secondaryText}
            </div>
          ) : null}
        </div>
        {unreadCount ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
            {unreadCount}
          </span>
        ) : null}
        {channel.lastMessageAt ? (
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(channel.lastMessageAt)}
          </span>
        ) : null}
      </button>
    );
  };

  const renderChannelItem = (channel: Channel) => (
    // eslint-disable-next-line react/prop-types
    <ChannelItem key={channel.id} channel={channel} />
  );

  const renderChannelItems = (items: Channel[]) => items.map(renderChannelItem);

  const SectionHeader = ({
    title,
    icon: Icon,
    count,
  }: {
    title: string;
    icon: typeof Hash;
    count: number;
  }) => (
    <div className="mb-2 flex items-center justify-between px-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase">
        <Icon className="h-3.5 w-3.5" />
        {title}
        <span className="ml-1 text-muted-foreground/60">({count})</span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={cn("flex h-full w-64 flex-col border-r bg-muted/30 p-4", className)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Channels</h2>
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 w-full animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full w-72 flex-col border-r bg-muted/30", className)}>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Chat</h2>
            {totalUnreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {totalUnreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onMarkAllAsRead && totalUnreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2 text-muted-foreground"
                onClick={onMarkAllAsRead}
              >
                Mark all read
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={onCreateDm}
                  >
                    <AtSign className="mr-2 h-4 w-4" />
                    New DM
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={onCreateChannel}
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    New Channel
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 pb-4">
          {publicChannels.length > 0 && (
            <div>
              <SectionHeader
                title="Channels"
                icon={Hash}
                count={publicChannels.length}
              />
              <div className="space-y-0.5">
                {renderChannelItems(publicChannels)}
              </div>
            </div>
          )}

          {privateChannels.length > 0 && (
            <div>
              <SectionHeader
                title="Private"
                icon={Lock}
                count={privateChannels.length}
              />
              <div className="space-y-0.5">
                {renderChannelItems(privateChannels)}
              </div>
            </div>
          )}

          {dmChannels.length > 0 && (
            <div>
              <SectionHeader
                title="Direct Messages"
                icon={MessageCircle}
                count={dmChannels.length}
              />
              <div className="space-y-0.5">
                {renderChannelItems(dmChannels)}
              </div>
            </div>
          )}

          {filteredChannels.length === 0 && search && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No channels match &quot;{search}&quot;
              </p>
            </div>
          )}

          {filteredChannels.length === 0 && !search && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No channels yet
              </p>
              <Button
                variant="link"
                className="mt-1 h-auto p-0"
                onClick={onCreateChannel}
              >
                Create your first channel
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
