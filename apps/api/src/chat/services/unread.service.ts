import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChannelMember, ChannelMemberDocument } from '../schemas/channel-member.schema';
import { Message } from '../schemas/message.schema';
import { WorkspaceRequestContext } from '../../workspaces/interfaces/workspace-context.interface';

export interface UnreadSummary {
  totalUnread: number;
  channelUnreads: Array<{
    channelId: string;
    unreadCount: number;
    lastReadAt?: Date;
  }>;
}

@Injectable()
export class UnreadService {
  constructor(
    @InjectModel(ChannelMember.name) private readonly channelMemberModel: Model<ChannelMemberDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  async markAsRead(
    workspace: WorkspaceRequestContext,
    channelId: string,
    messageId: string,
  ): Promise<void> {
    await this.channelMemberModel.findOneAndUpdate(
      {
        channelId: new Types.ObjectId(channelId),
        userId: new Types.ObjectId(workspace.actorUserId),
      },
      {
        lastReadMessageId: new Types.ObjectId(messageId),
        lastReadAt: new Date(),
        unreadCount: 0,
      },
      { upsert: true },
    );
  }

  async markAllAsRead(
    workspace: WorkspaceRequestContext,
  ): Promise<{ markedCount: number }> {
    const result = await this.channelMemberModel.updateMany(
      {
        userId: new Types.ObjectId(workspace.actorUserId),
      },
      {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    );

    return { markedCount: result.modifiedCount };
  }

  async getUnreadCount(
    workspace: WorkspaceRequestContext,
  ): Promise<{ count: number }> {
    const result = await this.channelMemberModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(workspace.actorUserId),
          unreadCount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$unreadCount' },
        },
      },
    ]);

    return { count: result[0]?.total || 0 };
  }

  async getUnreadSummary(
    workspace: WorkspaceRequestContext,
  ): Promise<UnreadSummary> {
    const members = await this.channelMemberModel
      .find({
        userId: new Types.ObjectId(workspace.actorUserId),
        unreadCount: { $gt: 0 },
      })
      .sort({ unreadCount: -1 })
      .exec();

    const totalUnread = members.reduce((sum, m) => sum + m.unreadCount, 0);

    return {
      totalUnread,
      channelUnreads: members.map(m => ({
        channelId: m.channelId.toString(),
        unreadCount: m.unreadCount,
        lastReadAt: m.lastReadAt,
      })),
    };
  }

  async recalculateUnread(
    workspace: WorkspaceRequestContext,
    channelId: string,
  ): Promise<void> {
    const member = await this.channelMemberModel.findOne({
      channelId: new Types.ObjectId(channelId),
      userId: new Types.ObjectId(workspace.actorUserId),
    });

    if (!member || !member.lastReadMessageId) {
      // Count all messages
      const count = await this.messageModel.countDocuments({
        channelId: new Types.ObjectId(channelId),
        deletedAt: null,
      });

      await this.channelMemberModel.updateOne(
        { _id: member?._id },
        { unreadCount: count },
      );
      return;
    }

    // Count messages after last read
    const lastReadMessage = await this.messageModel.findById(member.lastReadMessageId);
    if (!lastReadMessage) return;

    const count = await this.messageModel.countDocuments({
      channelId: new Types.ObjectId(channelId),
      createdAt: { $gt: lastReadMessage.createdAt },
      deletedAt: null,
    });

    await this.channelMemberModel.updateOne(
      { _id: member._id },
      { unreadCount: count },
    );
  }
}
