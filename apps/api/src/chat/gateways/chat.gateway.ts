import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { UseGuards, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChannelsService } from '../services/channels.service';
import { MessagesService } from '../services/messages.service';
import { UnreadService } from '../services/unread.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { MarkReadDto } from '../dto/mark-read.dto';
import { WorkspaceRequestContext } from '../../workspaces/interfaces/workspace-context.interface';

interface JwtPayload {
  sub: string;
  email: string;
}

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  // Track online users: userId -> socketId[]
  private readonly onlineUsers = new Map<string, string[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
    private readonly unreadService: UnreadService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data.userId = payload.sub;
      client.data.workspaceId = (client.handshake.query.workspaceId as string) || undefined;

      // Track online status
      this.addOnlineUser(payload.sub, client.id);

      this.logger.log(`Client connected: ${client.id}, user: ${payload.sub}`);

      // Send connection success
      client.emit('connected', {
        socketId: client.id,
        userId: payload.sub,
      });
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId;
    if (userId) {
      this.removeOnlineUser(userId, client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:channel')
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ): Promise<void> {
    const { channelId } = data;
    const userId = client.data.userId;
    const workspaceId = client.data.workspaceId;

    // Verify access
    const canAccess = await this.channelsService.canAccess(
      userId,
      channelId,
      workspaceId,
    );

    if (!canAccess) {
      client.emit('error', { message: 'Access denied to channel' });
      return;
    }

    client.join(`ch:${channelId}`);
    client.emit('joined:channel', { channelId });

    this.logger.log(`User ${userId} joined channel ${channelId}`);
  }

  @SubscribeMessage('leave:channel')
  async handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ): Promise<void> {
    const { channelId } = data;
    client.leave(`ch:${channelId}`);
    client.emit('left:channel', { channelId });
  }

  @SubscribeMessage('send:message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ): Promise<void> {
    const userId = client.data.userId;
    const workspaceId = client.data.workspaceId;

    try {
      // Verify access
      const canAccess = await this.channelsService.canAccess(
        userId,
        dto.channelId,
        workspaceId,
      );

      if (!canAccess) {
        client.emit('error', { message: 'Access denied to channel' });
        return;
      }

      // Save message
      const workspaceContext: WorkspaceRequestContext = {
        workspaceId: workspaceId ?? '',
        actorUserId: userId,
        role: 'member' as any,
        membershipStatus: 'active' as any,
        permissions: [],
        workspaceName: '',
        workspaceType: 'personal' as any,
      };
      const message = await this.messagesService.create(workspaceContext, dto);

      // Update channel last message
      await this.channelsService.updateLastMessage(
        dto.channelId,
        (message as any)._id.toString(),
      );

      // Prepare response
      const msg = message as any;
      const messageData = {
        id: msg._id.toString(),
        channelId: msg.channelId.toString(),
        authorId: msg.authorId.toString(),
        content: msg.content,
        mentionIds: (msg.mentionIds || []).map((id: any) => id.toString()),
        createdAt: msg.createdAt,
        tempId: dto.tempId,
      };

      // Broadcast to channel
      this.server.to(`ch:${dto.channelId}`).emit('message:new', messageData);

      // Acknowledge sender
      client.emit('message:sent', {
        id: (message as any)._id.toString(),
        tempId: dto.tempId,
        channelId: dto.channelId,
      });

      this.logger.debug(`Message sent to channel ${dto.channelId}`);
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('mark:read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: MarkReadDto,
  ): Promise<void> {
    const userId = client.data.userId;
    const workspaceId = client.data.workspaceId;

    try {
      const workspaceContext: WorkspaceRequestContext = {
        workspaceId: workspaceId ?? '',
        actorUserId: userId,
        role: 'member' as any,
        membershipStatus: 'active' as any,
        permissions: [],
        workspaceName: '',
        workspaceType: 'personal' as any,
      };
      await this.unreadService.markAsRead(workspaceContext,
        dto.channelId,
        dto.messageId,
      );

      client.emit('read:confirmed', {
        channelId: dto.channelId,
        messageId: dto.messageId,
      });
    } catch (error) {
      this.logger.error(`Failed to mark read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark as read' });
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ): Promise<void> {
    const userId = client.data.userId;
    client.to(`ch:${data.channelId}`).emit('typing:start', {
      channelId: data.channelId,
      userId,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ): Promise<void> {
    const userId = client.data.userId;
    client.to(`ch:${data.channelId}`).emit('typing:stop', {
      channelId: data.channelId,
      userId,
    });
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth;
    if (auth?.token) return auth.token;

    const header = client.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.substring(7);
    }

    return null;
  }

  private addOnlineUser(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId) || [];
    sockets.push(socketId);
    this.onlineUsers.set(userId, sockets);
  }

  private removeOnlineUser(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId) || [];
    const filtered = sockets.filter(id => id !== socketId);

    if (filtered.length === 0) {
      this.onlineUsers.delete(userId);
    } else {
      this.onlineUsers.set(userId, filtered);
    }
  }

  // Public method to broadcast from other services
  broadcastToChannel(channelId: string, event: string, data: unknown): void {
    this.server.to(`ch:${channelId}`).emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}
