import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';

/**
 * Encapsulates all Mongoose queries for Notifications (arch-use-repository-pattern).
 */
@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Create a new notification for a user.
   */
  async create(
    userId: string | Types.ObjectId,
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      ...dto,
      userId: new Types.ObjectId(userId.toString()),
      isRead: false,
      readAt: null,
    });
    return notification.save();
  }

  /**
   * Find a notification by ID and user ID (user-scoped access).
   */
  async findByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();
  }

  /**
   * Find notifications with pagination and filters.
   */
  async findWithPaginationAndFilters(
    userId: string | Types.ObjectId,
    query: QueryNotificationDto,
  ): Promise<{ items: NotificationDocument[]; total: number }> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId.toString()),
    };

    // Filter by notification type
    if (query.type) {
      filter.type = query.type;
    }

    // Filter by read status
    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    // Sort by createdAt (default: newest first)
    const sortObj: Record<string, 1 | -1> = {};
    if (query.sortBy) {
      sortObj[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  /**
   * Count unread notifications for a user.
   */
  async countUnread(
    userId: string | Types.ObjectId,
  ): Promise<number> {
    return this.notificationModel
      .countDocuments({
        userId: new Types.ObjectId(userId.toString()),
        isRead: false,
      })
      .exec();
  }

  /**
   * Mark a specific notification as read/unread.
   */
  async markAsRead(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    isRead: boolean,
  ): Promise<NotificationDocument | null> {
    const updateData: Partial<Notification> = {
      isRead,
      readAt: isRead ? new Date() : null,
    };

    return this.notificationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          userId: new Types.ObjectId(userId.toString()),
        },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(
    userId: string | Types.ObjectId,
  ): Promise<number> {
    const result = await this.notificationModel
      .updateMany(
        {
          userId: new Types.ObjectId(userId.toString()),
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
      )
      .exec();

    return result.modifiedCount;
  }

  /**
   * Delete a notification (user-scoped).
   */
  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<boolean> {
    const result = await this.notificationModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();

    return result.deletedCount > 0;
  }

  /**
   * Delete all read notifications older than a specific date.
   * Useful for cleanup jobs.
   */
  async deleteOldReadNotifications(beforeDate: Date): Promise<number> {
    const result = await this.notificationModel
      .deleteMany({
        isRead: true,
        readAt: { $lt: beforeDate },
      })
      .exec();

    return result.deletedCount;
  }
}
