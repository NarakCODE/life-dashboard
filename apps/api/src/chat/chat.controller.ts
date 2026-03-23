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

import {
  CreateChannelDto,
  SendMessageDto,
  QueryMessagesDto,
  MarkReadDto,
} from './dto';
import { Channel } from './schemas/channel.schema';
import { Message } from './schemas/message.schema';

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
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Channels
  // ─────────────────────────────────────────────────────────────────────────

  @Post('channels')
  @ApiOperation({ summary: 'Create a new channel' })
  @ApiCreatedResponse({ description: 'Channel created successfully' })
  createChannel(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: CreateChannelDto,
  ): Promise<Channel> {
    return this.channelsService.create(workspace, dto);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get all channels for the user' })
  @ApiOkResponse({ description: 'List of channels' })
  findChannels(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<Channel[]> {
    return this.channelsService.findMany(workspace);
  }

  @Get('channels/:id')
  @ApiOperation({ summary: 'Get a specific channel by ID' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  @ApiOkResponse({ description: 'Channel details' })
  findChannelById(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<Channel> {
    return this.channelsService.findById(id, workspace);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Messages
  // ─────────────────────────────────────────────────────────────────────────

  @Post('messages')
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiCreatedResponse({ description: 'Message sent successfully' })
  sendMessage(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() dto: SendMessageDto,
  ): Promise<Message> {
    return this.messagesService.create(workspace, dto);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get messages with pagination' })
  @ApiOkResponse({ description: 'Paginated messages' })
  findMessages(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() query: QueryMessagesDto,
  ): Promise<{ items: Message[]; total: number; hasMore: boolean }> {
    return this.messagesService.findMany(workspace, query);
  }

  @Get('channels/:channelId/messages')
  @ApiOperation({ summary: 'Get messages for a specific channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  @ApiOkResponse({ description: 'Channel messages' })
  async findChannelMessages(
    @Param('channelId') channelId: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() query: QueryMessagesDto,
  ): Promise<{ items: Message[]; total: number; hasMore: boolean }> {
    // Verify access first
    await this.channelsService.findById(channelId, workspace);

    // Create query with channelId included
    const queryWithChannel = { ...query, channelId };

    return this.messagesService.findMany(workspace, queryWithChannel as any);
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
  getUnreadSummary(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ): Promise<{
    totalUnread: number;
    channelUnreads: Array<{
      channelId: string;
      unreadCount: number;
      lastReadAt?: Date;
    }>;
  }> {
    return this.unreadService.getUnreadSummary(workspace);
  }
}
