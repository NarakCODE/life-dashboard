import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

/**
 * Encapsulates all Mongoose queries for Notifications (arch-use-repository-pattern).
 */
@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  // TODO: Implement repository methods
  // async findById(id: string | Types.ObjectId): Promise<NotificationDocument | null>
  // async findByUserId(userId: string | Types.ObjectId): Promise<NotificationDocument[]>
  // async findUnreadByUserId(userId: string | Types.ObjectId): Promise<NotificationDocument[]>
  // async create(dto: CreateNotificationDto, userId: string): Promise<NotificationDocument>
  // async markAsRead(id: string): Promise<void>
  // async markAllAsRead(userId: string): Promise<void>
  // async delete(id: string): Promise<void>
}
