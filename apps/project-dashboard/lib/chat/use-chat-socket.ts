"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";
import type { SocketMessage, TypingEvent } from "@/lib/chat/types";

interface UseChatSocketOptions {
  workspaceId?: string;
  onMessage?: (message: SocketMessage) => void;
  onTypingStart?: (event: TypingEvent) => void;
  onTypingStop?: (event: TypingEvent) => void;
  onError?: (error: string) => void;
}

export function useChatSocket(options: UseChatSocketOptions) {
  const { workspaceId, onMessage, onTypingStart, onTypingStop, onError } = options;
  const { tokens } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!tokens?.accessToken || !workspaceId) return;

    setIsConnecting(true);

    const socket = io(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat`, {
      transports: ["websocket"],
      auth: {
        token: tokens.accessToken,
      },
      query: {
        workspaceId,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setIsConnecting(false);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("error", (error: { message: string }) => {
      onError?.(error.message);
    });

    socket.on("message:new", (message: SocketMessage) => {
      onMessage?.(message);
    });

    socket.on("typing:start", (event: TypingEvent) => {
      onTypingStart?.(event);
    });

    socket.on("typing:stop", (event: TypingEvent) => {
      onTypingStop?.(event);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tokens?.accessToken, workspaceId, onMessage, onTypingStart, onTypingStop, onError]);

  const joinChannel = useCallback((channelId: string) => {
    socketRef.current?.emit("join:channel", { channelId });
  }, []);

  const leaveChannel = useCallback((channelId: string) => {
    socketRef.current?.emit("leave:channel", { channelId });
  }, []);

  const sendMessage = useCallback(
    (channelId: string, content: string, tempId?: string) => {
      socketRef.current?.emit("send:message", {
        channelId,
        content,
        tempId,
        mentionIds: [],
      });
    },
    [],
  );

  const markAsRead = useCallback((channelId: string, messageId: string) => {
    socketRef.current?.emit("mark:read", { channelId, messageId });
  }, []);

  const startTyping = useCallback((channelId: string) => {
    socketRef.current?.emit("typing:start", { channelId });
  }, []);

  const stopTyping = useCallback((channelId: string) => {
    socketRef.current?.emit("typing:stop", { channelId });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    joinChannel,
    leaveChannel,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  };
}
