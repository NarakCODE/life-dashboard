import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { PaginatedResultDto } from '../common/dto/paginated-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Create a new notification (system use or admin).
   * Note: In production, this might be restricted to internal services.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new notification for the authenticated user' })
  @ApiCreatedResponse({
    description: 'The created notification',
    type: NotificationResponseDto,
  })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.create(userId, createNotificationDto);
  }

  /**
   * List notifications for the authenticated user with pagination and filters.
   */
  @Get()
  @ApiOperation({ summary: 'Get all notifications with pagination and filtering' })
  @ApiOkResponse({
    description: 'List of notifications and total count',
    type: PaginatedResultDto<NotificationResponseDto>,
  })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() queryNotificationDto: QueryNotificationDto,
  ): Promise<PaginatedResultDto<NotificationResponseDto>> {
    return this.notificationsService.findMany(userId, queryNotificationDto);
  }

  /**
   * Get the count of unread notifications for the authenticated user.
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiOkResponse({
    description: 'The number of unread notifications',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
      },
    },
  })
  getUnreadCount(
    @CurrentUser('sub') userId: string,
  ): Promise<{ count: number }> {
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * Get a specific notification by ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific notification by ID' })
  @ApiOkResponse({
    description: 'The notification object',
    type: NotificationResponseDto,
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.findByIdAndUser(id, userId);
  }

  /**
   * Mark a notification as read or unread.
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read or unread' })
  @ApiOkResponse({
    description: 'The updated notification',
    type: NotificationResponseDto,
  })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() markAsReadDto: MarkAsReadDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(
      id,
      userId,
      markAsReadDto.isRead,
    );
  }

  /**
   * Mark all notifications as read for the authenticated user.
   */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({
    description: 'Number of notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        markedCount: { type: 'number', example: 12 },
      },
    },
  })
  markAllAsRead(
    @CurrentUser('sub') userId: string,
  ): Promise<{ markedCount: number }> {
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * Delete a notification.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiOkResponse({ description: 'Notification successfully deleted' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<void> {
    return this.notificationsService.delete(id, userId);
  }
}
