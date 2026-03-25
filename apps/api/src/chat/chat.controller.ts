import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

import { ChannelsService } from './services/channels.service';
import { MessagesService } from './services/messages.service';
import { UnreadService } from './services/unread.service';
import { ChatConfigService } from './services/chat-config.service';

import {
  CreateChannelDto,
  SendMessageDto,
  QueryMessagesDto,
  MarkReadDto,
  MessageResponseDto,
  ChannelResponseDto,
  UpdateMessageDto,
  UpdateChatConfigDto,
  ChatConfigResponseDto,
} from './dto';

@ApiTags('chat')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped chat routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
    private readonly unreadService: UnreadService,
    private readonly chatConfigService: ChatConfigService,
  ) {}

  /**
   * Transform Channel document to ChannelResponseDto
   */
  private toChannelResponse(channel: any): ChannelResponseDto {
    const raw = channel.toObject ? channel.toObject() : channel;

    return new ChannelResponseDto({
      id: raw._id?.toString() ?? raw.id,
      workspaceId: raw.workspaceId?.toString() ?? null,
      type: raw.type,
      name: raw.name,
      description: raw.description,
      memberIds: (raw.memberIds || []).map((id: any) => id.toString?.() ?? id),
      unreadCount: 0,
      lastMessageId: raw.lastMessageId?.toString() ?? null,
      lastMessageAt: raw.lastMessageAt?.toISOString() ?? null,
      createdBy: raw.createdBy?.toString() ?? raw.createdBy,
      createdAt: raw.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: raw.updatedAt?.toISOString() ?? new Date().toISOString(),
    });
  }

  /**
   * Transform Message document to MessageResponseDto
   */
  private toMessageResponse(message: any): MessageResponseDto {
    const raw = message.toObject ? message.toObject() : message;

    return new MessageResponseDto({
      id: raw._id?.toString() ?? raw.id,
      channelId: raw.channelId?.toString() ?? raw.channelId,
      workspaceId: raw.workspaceId?.toString() ?? null,
      authorId: raw.authorId?.toString() ?? raw.authorId,
      content: raw.content,
      mentionIds: (raw.mentionIds || []).map(
        (id: any) => id.toString?.() ?? id,
      ),
      editedAt: raw.editedAt?.toISOString() ?? null,
      deletedAt: raw.deletedAt?.toISOString() ?? null,
      createdAt: raw.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: raw.updatedAt?.toISOString() ?? new Date().toISOString(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Channels
  // ─────────────────────────────────────────────────────────────────────────

  @Post('channels')
  @ApiOperation({ summary: 'Create a new channel' })
  @ApiCreatedResponse({
    type: ChannelResponseDto,
    description: 'Channel created successfully',
  })
  async createChannel(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: CreateChannelDto,
  ): Promise<ChannelResponseDto> {
    const channel = await this.channelsService.create(workspace, dto);
    return this.toChannelResponse(channel);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get all channels for the user' })
  @ApiOkResponse({
    type: [ChannelResponseDto],
    description: 'List of channels',
  })
  async findChannels(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<ChannelResponseDto[]> {
    const channels = await this.channelsService.findMany(workspace);
    return channels.map((channel) => this.toChannelResponse(channel));
  }

  @Get('channels/:id')
  @ApiOperation({ summary: 'Get a specific channel by ID' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  @ApiOkResponse({ type: ChannelResponseDto, description: 'Channel details' })
  async findChannelById(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<ChannelResponseDto> {
    const channel = await this.channelsService.findById(id, workspace);
    return this.toChannelResponse(channel);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Messages
  // ─────────────────────────────────────────────────────────────────────────

  @Post('messages')
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Message sent successfully',
  })
  async sendMessage(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.create(workspace, dto);
    return this.toMessageResponse(message);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get messages with pagination' })
  @ApiOkResponse({ description: 'Paginated messages' })
  async findMessages(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() query: QueryMessagesDto,
  ): Promise<{ items: MessageResponseDto[]; total: number; hasMore: boolean }> {
    const result = await this.messagesService.findMany(workspace, query);
    return {
      items: result.items.map((message) => this.toMessageResponse(message)),
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  @Get('channels/:channelId/messages')
  @ApiOperation({ summary: 'Get messages for a specific channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  @ApiOkResponse({ description: 'Channel messages' })
  async findChannelMessages(
    @Param('channelId') channelId: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() query: QueryMessagesDto,
  ): Promise<{ items: MessageResponseDto[]; total: number; hasMore: boolean }> {
    // Verify access first
    await this.channelsService.findById(channelId, workspace);

    // Create query with channelId included
    const queryWithChannel = { ...query, channelId };

    const result = await this.messagesService.findMany(
      workspace,
      queryWithChannel as any,
    );
    return {
      items: result.items.map((message) => this.toMessageResponse(message)),
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a message (soft delete)' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiOkResponse({ description: 'Message deleted' })
  deleteMessage(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<void> {
    return this.messagesService.delete(id, workspace);
  }

  @Patch('messages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a message (edit)' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiOkResponse({ type: MessageResponseDto, description: 'Message updated' })
  async updateMessage(
    @Param('id') id: string,
    @Body() dto: UpdateMessageDto,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.update(
      id,
      workspace,
      dto.content,
    );
    return this.toMessageResponse(message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Unread / Read Status
  // ─────────────────────────────────────────────────────────────────────────

  @Post('channels/:channelId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read up to a specific message' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  @ApiOkResponse({ description: 'Marked as read' })
  markAsRead(
    @Param('channelId') channelId: string,
    @Body() dto: MarkReadDto,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<void> {
    return this.unreadService.markAsRead(workspace, channelId, dto.messageId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages as read' })
  @ApiOkResponse({ description: 'All messages marked as read' })
  markAllAsRead(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<{ markedCount: number }> {
    return this.unreadService.markAllAsRead(workspace);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  @ApiOkResponse({ description: 'Unread count' })
  getUnreadCount(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<{ count: number }> {
    return this.unreadService.getUnreadCount(workspace);
  }

  @Get('unread-summary')
  @ApiOperation({ summary: 'Get unread summary by channel' })
  @ApiOkResponse({ description: 'Unread summary' })
  async getUnreadSummary(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<{
    totalUnread: number;
    channelUnreads: Array<{
      channelId: string;
      unreadCount: number;
      lastReadAt?: string;
    }>;
  }> {
    const result = await this.unreadService.getUnreadSummary(workspace);
    return {
      totalUnread: result.totalUnread,
      channelUnreads: result.channelUnreads.map((c) => ({
        channelId: c.channelId,
        unreadCount: c.unreadCount,
        lastReadAt: c.lastReadAt?.toISOString(),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Chat Configuration (Auto-delete settings)
  // ─────────────────────────────────────────────────────────────────────────

  @Get('config')
  @ApiOperation({ summary: 'Get chat configuration for the workspace' })
  @ApiOkResponse({
    type: ChatConfigResponseDto,
    description: 'Chat configuration',
  })
  async getChatConfig(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<ChatConfigResponseDto> {
    const config = await this.chatConfigService.getConfig(
      workspace.workspaceId,
    );
    return new ChatConfigResponseDto({
      id: (config as any)._id.toString(),
      workspaceId: config.workspaceId.toString(),
      autoDeletePreset: config.autoDeletePreset,
      autoDeleteCustomSeconds: config.autoDeleteCustomSeconds,
      autoDeleteForAllUsers: config.autoDeleteForAllUsers,
      notifyBeforeDeletion: config.notifyBeforeDeletion,
      autoDeleteSeconds: this.calculateAutoDeleteSeconds(config),
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    });
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update chat configuration for the workspace' })
  @ApiOkResponse({
    type: ChatConfigResponseDto,
    description: 'Updated chat configuration',
  })
  async updateChatConfig(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: UpdateChatConfigDto,
  ): Promise<ChatConfigResponseDto> {
    const config = await this.chatConfigService.updateConfig(
      workspace.workspaceId,
      dto,
    );
    return new ChatConfigResponseDto({
      id: (config as any)._id.toString(),
      workspaceId: config.workspaceId.toString(),
      autoDeletePreset: config.autoDeletePreset,
      autoDeleteCustomSeconds: config.autoDeleteCustomSeconds,
      autoDeleteForAllUsers: config.autoDeleteForAllUsers,
      notifyBeforeDeletion: config.notifyBeforeDeletion,
      autoDeleteSeconds: this.calculateAutoDeleteSeconds(config),
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    });
  }

  /**
   * Calculate auto-delete seconds from preset
   */
  private calculateAutoDeleteSeconds(config: any): number | null {
    if (config.autoDeletePreset === 'off') {
      return null;
    }
    if (config.autoDeletePreset === 'custom') {
      return config.autoDeleteCustomSeconds || null;
    }
    
    const presetSeconds: Record<string, number> = {
      '1h': 3600,
      '1d': 86400,
      '7d': 604800,
      '30d': 2592000,
    };
    
    return presetSeconds[config.autoDeletePreset] || null;
  }
}
