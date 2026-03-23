import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { ChannelMember } from '../schemas/channel-member.schema';
import { SendMessageDto } from '../dto/send-message.dto';
import { QueryMessagesDto } from '../dto/query-messages.dto';
import { WorkspaceRequestContext } from '../../workspaces/interfaces/workspace-context.interface';

export interface PaginatedMessages {
  items: Message[];
  total: number;
  hasMore: boolean;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(ChannelMember.name) private readonly channelMemberModel: Model<ChannelMember>,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: SendMessageDto,
  ): Promise<Message> {
    const message = new this.messageModel({
      channelId: new Types.ObjectId(dto.channelId),
      workspaceId: workspace.workspaceId ? new Types.ObjectId(workspace.workspaceId) : null,
      authorId: new Types.ObjectId(workspace.actorUserId),
      content: dto.content.trim(),
      mentionIds: (dto.mentionIds || []).map(id => new Types.ObjectId(id)),
    });

    const saved = await message.save();

    // Increment unread count for all channel members except sender
    await this.incrementUnreadCount(dto.channelId, workspace.actorUserId);

    return saved;
  }

  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryMessagesDto & { channelId?: string },
  ): Promise<PaginatedMessages> {
    const filter: Record<string, unknown> = {
      workspaceId: workspace.workspaceId ? new Types.ObjectId(workspace.workspaceId) : null,
      deletedAt: null,
    };

    if (query.channelId) {
      filter.channelId = new Types.ObjectId(query.channelId);
    }

    if (query.before) {
      filter.createdAt = { $lt: new Date(query.before) };
    }

    if (query.after) {
      filter.createdAt = { ...(filter.createdAt || {}), $gt: new Date(query.after) };
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.messageModel.countDocuments(filter),
    ]);

    return {
      items: items.reverse(), // Return oldest first for chat UI
      total,
      hasMore: total > skip + items.length,
    };
  }

  async findById(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<Message> {
    const message = await this.messageModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: workspace.workspaceId ? new Types.ObjectId(workspace.workspaceId) : null,
      deletedAt: null,
    }).exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async delete(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<void> {
    const result = await this.messageModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        authorId: new Types.ObjectId(workspace.actorUserId),
        workspaceId: workspace.workspaceId ? new Types.ObjectId(workspace.workspaceId) : null,
      },
      { deletedAt: new Date() },
    ).exec();

    if (!result) {
      throw new NotFoundException('Message not found or access denied');
    }
  }

  private async incrementUnreadCount(
    channelId: string,
    excludeUserId: string,
  ): Promise<void> {
    await this.channelMemberModel.updateMany(
      {
        channelId: new Types.ObjectId(channelId),
        userId: { $ne: new Types.ObjectId(excludeUserId) },
      },
      {
        $inc: { unreadCount: 1 },
      },
    );
  }
}
