import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
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
    scope: WorkspaceScope,
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      ...dto,
      workspaceId: toObjectId(scope.workspaceId),
      userId: toObjectId(scope.userId),
      recipientUserId: toObjectId(scope.userId),
      createdBy: toObjectId(scope.userId),
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
    scope: WorkspaceScope,
  ): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
      })
      .exec();
  }

  /**
   * Find notifications with pagination and filters.
   */
  async findWithPaginationAndFilters(
    scope: WorkspaceScope,
    query: QueryNotificationDto,
  ): Promise<{ items: NotificationDocument[]; total: number }> {
    const filter: Record<string, unknown> = {
      ...buildWorkspaceScopedFilter(scope, {
        userId: toObjectId(scope.userId),
      }),
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
  async countUnread(scope: WorkspaceScope): Promise<number> {
    return this.notificationModel
      .countDocuments({
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
        isRead: false,
      })
      .exec();
  }

  /**
   * Mark a specific notification as read/unread.
   */
  async markAsRead(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
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
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
        },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(scope: WorkspaceScope): Promise<number> {
    const result = await this.notificationModel
      .updateMany(
        {
          ...buildWorkspaceScopedFilter(scope, {
            userId: toObjectId(scope.userId),
          }),
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
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const result = await this.notificationModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        ...buildWorkspaceScopedFilter(scope, {
          userId: toObjectId(scope.userId),
        }),
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
