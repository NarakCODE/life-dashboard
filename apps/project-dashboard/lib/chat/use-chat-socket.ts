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
  onMessageSent?: (data: { id: string; tempId?: string; channelId: string }) => void;
  onReadConfirmed?: (data: { channelId: string; messageId: string }) => void;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function useChatSocket(options: UseChatSocketOptions = {}) {
  const {
    workspaceId,
    onMessage,
    onTypingStart,
    onTypingStop,
    onError,
    onMessageSent,
    onReadConfirmed,
  } = options;
  const { tokens } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Store callbacks in refs to avoid recreating connect function
  const callbacksRef = useRef({
    onMessage,
    onTypingStart,
    onTypingStop,
    onError,
    onMessageSent,
    onReadConfirmed,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onTypingStart,
      onTypingStop,
      onError,
      onMessageSent,
      onReadConfirmed,
    };
  }, [onMessage, onTypingStart, onTypingStop, onError, onMessageSent, onReadConfirmed]);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000; // Start with 1s, will exponential backoff

  const disconnect = useCallback(() => {
    console.log("🔴 Manual disconnect called");
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(() => {
    if (!tokens?.accessToken || !workspaceId) return;

    // Prevent multiple connections
    if (socketRef.current) {
      console.log("⚠️ Socket already exists, skipping connection");
      return;
    }

    if ((socketRef.current as any)?.connected) {
      console.log("⚠️ Socket already connected, skipping");
      return;
    }

    console.log("🔵 Attempting to connect to WebSocket...");
    setIsConnecting(true);
    setConnectionError(null);

    // Socket.IO connects to the server root, not the API prefix
    // Remove /api/v1 prefix if present
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3001';
    
    const socket = io(`${baseUrl}/chat`, {
      transports: ['websocket', 'polling'],
      auth: {
        token: tokens.accessToken,
      },
      query: {
        workspaceId,
      },
      reconnection: false,
      reconnectionAttempts: 0,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
    });

    socket.on("disconnect", (reason, detail) => {
      console.log("❌ Socket disconnected:", reason, detail);
      setIsConnected(false);
      // Don't clear socketRef here - allow reconnection
    });

    socket.on("connect_error", (error: any) => {
      console.error("🔴 Connection error:", error.message);
      console.error("Full error:", error);
      setIsConnecting(false);
      setConnectionError(error.message);
      callbacksRef.current.onError?.(error.message);
      attemptReconnect();
    });

    socket.on("error", (error: any) => {
      console.error("⚠️ Socket error:", error);
      setConnectionError(error.message);
      callbacksRef.current.onError?.(error.message);
    });

    socket.on("message:new", (message: SocketMessage) => {
      callbacksRef.current.onMessage?.(message);
    });

    socket.on("message:sent", (data: { id: string; tempId?: string; channelId: string }) => {
      callbacksRef.current.onMessageSent?.(data);
    });

    socket.on("typing:start", (event: TypingEvent) => {
      callbacksRef.current.onTypingStart?.(event);
    });

    socket.on("typing:stop", (event: TypingEvent) => {
      callbacksRef.current.onTypingStop?.(event);
    });

    socket.on("read:confirmed", (data: { channelId: string; messageId: string }) => {
      callbacksRef.current.onReadConfirmed?.(data);
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [tokens?.accessToken, workspaceId]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log("Max reconnection attempts reached");
      setConnectionError("Unable to connect. Please refresh the page.");
      return;
    }

    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;

    console.log(`Attempting reconnection in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  // Initial connection - only run once when tokens or workspaceId change
  useEffect(() => {
    if (!tokens?.accessToken || !workspaceId) return;
    
    // Only connect if not already connected
    if (!socketRef.current) {
      connect();
    }
    
    // Cleanup on unmount or when tokens/workspaceId change
    return () => {
      // Clear any pending reconnect timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [tokens?.accessToken, workspaceId]);

  const joinChannel = useCallback((channelId: string) => {
    if ((socketRef.current as any)?.connected) {
      socketRef.current?.emit("join:channel", { channelId });
    }
  }, []);

  const leaveChannel = useCallback((channelId: string) => {
    if ((socketRef.current as any)?.connected) {
      socketRef.current?.emit("leave:channel", { channelId });
    }
  }, []);

  const sendMessage = useCallback(
    (channelId: string, content: string, tempId?: string): Promise<SendMessageResult> => {
      return new Promise((resolve) => {
        if (!(socketRef.current as any)?.connected) {
          resolve({ success: false, error: "Not connected to chat server" });
          return;
        }

        const timeout = setTimeout(() => {
          resolve({ success: false, error: "Message send timeout" });
        }, 5000);

        // Listen for acknowledgment
        const handleSent = (data: { id: string; tempId?: string; channelId: string }) => {
          if (data.tempId === tempId || data.channelId === channelId) {
            clearTimeout(timeout);
            (socketRef.current as any)?.off("message:sent", handleSent);
            resolve({ success: true, messageId: data.id });
          }
        };

        (socketRef.current as any)?.on("message:sent", handleSent);

        // Send message
        socketRef.current?.emit("send:message", {
          channelId,
          content,
          tempId,
          mentionIds: [],
        });
      });
    },
    [],
  );

  const markAsRead = useCallback((channelId: string, messageId: string) => {
    if ((socketRef.current as any)?.connected) {
      socketRef.current?.emit("mark:read", { channelId, messageId });
    }
  }, []);

  const startTyping = useCallback((channelId: string) => {
    if ((socketRef.current as any)?.connected) {
      socketRef.current?.emit("typing:start", { channelId });
    }
  }, []);

  const stopTyping = useCallback((channelId: string) => {
    if ((socketRef.current as any)?.connected) {
      socketRef.current?.emit("typing:stop", { channelId });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    connectionError,
    joinChannel,
    leaveChannel,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    disconnect,
  };
}
