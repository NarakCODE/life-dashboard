import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
import { WsUser } from '../../auth/decorators/ws-user.decorator';
import { JwtPayload } from '../../auth/dto/auth-tokens.dto';

/**
 * WebSocket Gateway for real-time notifications
 *
 * Events emitted by server:
 * - `notification:new` - When a new notification is created for the user
 * - `notification:unread-count` - When unread count changes
 *
 * Events received from client:
 * - `notification:mark-read` - Mark a notification as read
 * - `notification:join-workspace` - Join workspace room for scoped updates
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  /**
   * Map to track user socket connections
   * Key: userId, Value: Set of socket IDs
   */
  private userSockets: Map<string, Set<string>> = new Map();

  async handleConnection(client: Socket): Promise<void> {
    try {
      // Auth is handled by WsJwtGuard, user is attached to socket
      const user = (client as any).user as JwtPayload;

      if (!user?.sub) {
        this.logger.warn('Socket connection without valid user');
        client.disconnect();
        return;
      }

      const userId = user.sub;

      // Track this socket for the user
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user-specific room for direct messages
      client.join(`user:${userId}`);

      this.logger.log(
        `Client connected: ${client.id}, user: ${userId}, total sockets: ${this.userSockets.get(userId)?.size}`,
      );
    } catch (error) {
      this.logger.error(
        `Connection error: ${error instanceof Error ? error.message : String(error)}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      const user = (client as any).user as JwtPayload;
      const userId = user?.sub;

      if (userId && this.userSockets.has(userId)) {
        this.userSockets.get(userId)!.delete(client.id);

        // Clean up if no more sockets for this user
        if (this.userSockets.get(userId)!.size === 0) {
          this.userSockets.delete(userId);
        }
      }

      this.logger.log(
        `Client disconnected: ${client.id}, user: ${userId || 'unknown'}`,
      );
    } catch (error) {
      this.logger.error(
        `Disconnect error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Client joins a workspace room to receive workspace-scoped updates
   */
  @SubscribeMessage('notification:join-workspace')
  handleJoinWorkspace(
    @WsUser() user: JwtPayload,
    client: Socket,
    payload: { workspaceId: string },
  ): void {
    const roomName = `workspace:${payload.workspaceId}`;
    client.join(roomName);
    this.logger.debug(`User ${user.sub} joined room ${roomName}`);
  }

  /**
   * Client leaves a workspace room
   */
  @SubscribeMessage('notification:leave-workspace')
  handleLeaveWorkspace(
    @WsUser() user: JwtPayload,
    client: Socket,
    payload: { workspaceId: string },
  ): void {
    const roomName = `workspace:${payload.workspaceId}`;
    client.leave(roomName);
    this.logger.debug(`User ${user.sub} left room ${roomName}`);
  }

  /**
   * Send a notification to a specific user in real-time
   */
  sendNotificationToUser(
    userId: string,
    notification: {
      id: string;
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      createdAt: Date;
    },
  ): void {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit('notification:new', notification);
    this.logger.debug(
      `Notification sent to user ${userId}: ${notification.id}`,
    );
  }

  /**
   * Update unread count for a user in real-time
   */
  updateUnreadCount(userId: string, count: number): void {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit('notification:unread-count', { count });
    this.logger.debug(`Unread count updated for user ${userId}: ${count}`);
  }

  /**
   * Check if a user is currently online (has active sockets)
   */
  isUserOnline(userId: string): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
    );
  }

  /**
   * Get the number of active socket connections for a user
   */
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size ?? 0;
  }
}
