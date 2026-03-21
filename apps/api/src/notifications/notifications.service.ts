import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepo: NotificationsRepository) {}

  // TODO: Implement service methods
  // async findById(id: string): Promise<NotificationDocument>
  // async findByUserId(userId: string): Promise<NotificationDocument[]>
  // async findUnreadByUserId(userId: string): Promise<NotificationDocument[]>
  // async create(dto: CreateNotificationDto, userId: string): Promise<NotificationDocument>
  // async markAsRead(id: string): Promise<void>
  // async markAllAsRead(userId: string): Promise<void>
  // async delete(id: string): Promise<void>
}
