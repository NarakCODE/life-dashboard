"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface NotificationPayload {
  id: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
  createdAt: string
}

interface UseNotificationsSocketOptions {
  workspaceId?: string
  onNewNotification?: (notification: NotificationPayload) => void
  onUnreadCountUpdate?: (count: number) => void
  enabled?: boolean
}

/**
 * Hook for real-time notification updates via WebSocket
 * 
 * @example
 * ```tsx
 * useNotificationsSocket({
 *   workspaceId: "ws_123",
 *   onNewNotification: (notification) => {
 *     toast.info(notification.title)
 *   },
 *   onUnreadCountUpdate: (count) => {
 *     setUnreadCount(count)
 *   },
 * })
 * ```
 */
export function useNotificationsSocket({
  workspaceId,
  onNewNotification,
  onUnreadCountUpdate,
  enabled = true,
}: UseNotificationsSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { tokens, isAuthenticated } = useAuth()

  const connect = useCallback(() => {
    if (!tokens?.accessToken || !isAuthenticated || !enabled) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    
    socketRef.current = io(`${apiUrl}/notifications`, {
      auth: {
        token: tokens.accessToken,
      },
      transports: ["websocket"],
    })

    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("[NotificationsSocket] Connected")
      setIsConnected(true)

      // Join workspace room if specified
      if (workspaceId) {
        socket.emit("notification:join-workspace", { workspaceId })
      }
    })

    socket.on("disconnect", () => {
      console.log("[NotificationsSocket] Disconnected")
      setIsConnected(false)
    })

    socket.on("notification:new", (notification: NotificationPayload) => {
      console.log("[NotificationsSocket] New notification:", notification)
      // Show toast notification
      toast.info(notification.title, {
        description: notification.body,
      })
      onNewNotification?.(notification)
    })

    socket.on("notification:unread-count", ({ count }: { count: number }) => {
      console.log("[NotificationsSocket] Unread count update:", count)
      onUnreadCountUpdate?.(count)
    })

    socket.on("connect_error", (error) => {
      console.error("[NotificationsSocket] Connection error:", error)
    })
  }, [tokens?.accessToken, isAuthenticated, enabled, workspaceId, onNewNotification, onUnreadCountUpdate])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Reconnect when workspace changes
  useEffect(() => {
    if (!socketRef.current || !workspaceId) return

    // Leave old workspace and join new one
    socketRef.current.emit("notification:leave-workspace", { workspaceId })
    socketRef.current.emit("notification:join-workspace", { workspaceId })
  }, [workspaceId])

  return {
    socket: socketRef.current,
    isConnected,
  }
}
