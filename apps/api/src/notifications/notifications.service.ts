import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { PaginatedResultDto } from '../common/dto/paginated-result.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly notificationsRepo: NotificationsRepository) {}

  /**
   * Create a new notification for a user.
   * Used by the system or other modules to notify users.
   */
  async create(
    userId: string,
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepo.create(userId, dto);
    this.logger.log(`Notification created for user ${userId}: ${dto.type}`);
    return this.mapToResponseDto(notification);
  }

  /**
   * Find a notification by ID, scoped to the user.
   * Throws NotFoundException if not found or doesn't belong to user.
   */
  async findByIdAndUser(
    id: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepo.findByIdAndUser(id, userId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return this.mapToResponseDto(notification);
  }

  /**
   * List notifications for a user with pagination and filters.
   */
  async findMany(
    userId: string,
    query: QueryNotificationDto,
  ): Promise<PaginatedResultDto<NotificationResponseDto>> {
    const { items, total } = await this.notificationsRepo.findWithPaginationAndFilters(
      userId,
      query,
    );

    const data = items.map((item) => this.mapToResponseDto(item));
    return new PaginatedResultDto(data, total, query.page, query.limit);
  }

  /**
   * Get the count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationsRepo.countUnread(userId);
    return { count };
  }

  /**
   * Mark a notification as read or unread.
   */
  async markAsRead(
    id: string,
    userId: string,
    isRead: boolean = true,
  ): Promise<NotificationResponseDto> {
    // Verify the notification exists and belongs to the user
    const existing = await this.notificationsRepo.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    // Only update if the status is changing
    if (existing.isRead === isRead) {
      return this.mapToResponseDto(existing);
    }

    const updated = await this.notificationsRepo.markAsRead(id, userId, isRead);
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }

    this.logger.log(`Notification ${id} marked as ${isRead ? 'read' : 'unread'} by user ${userId}`);
    return this.mapToResponseDto(updated);
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    const markedCount = await this.notificationsRepo.markAllAsRead(userId);
    this.logger.log(`All notifications marked as read for user ${userId} (${markedCount} items)`);
    return { markedCount };
  }

  /**
   * Delete a notification (user-scoped).
   */
  async delete(id: string, userId: string): Promise<void> {
    // Verify the notification exists and belongs to the user
    const existing = await this.notificationsRepo.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    const deleted = await this.notificationsRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Notification not found');
    }

    this.logger.log(`Notification ${id} deleted by user ${userId}`);
  }

  /**
   * Map a NotificationDocument to NotificationResponseDto.
   */
  private mapToResponseDto(
    notification: NotificationDocument,
  ): NotificationResponseDto {
    return new NotificationResponseDto({
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    });
  }
}
