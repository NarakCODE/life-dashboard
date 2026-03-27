import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { ChannelMember } from '../schemas/channel-member.schema';
import { SendMessageDto } from '../dto/send-message.dto';
import { QueryMessagesDto } from '../dto/query-messages.dto';
import { WorkspaceRequestContext } from '../../workspaces/interfaces/workspace-context.interface';
import { ChatConfigService } from './chat-config.service';
import { UsersRepository } from '../../users/users.repository';
import { UserDocument } from '../../users/schemas/user.schema';

export interface PaginatedMessages {
  items: Message[];
  total: number;
  hasMore: boolean;
}

export interface MessageWithAuthor extends Message {
  author?: UserDocument;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(ChannelMember.name)
    private readonly channelMemberModel: Model<ChannelMember>,
    private readonly chatConfigService: ChatConfigService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: SendMessageDto,
  ): Promise<Message> {
    // Get chat config to calculate expiration
    const config = await this.chatConfigService.getConfig(
      workspace.workspaceId,
    );
    const expiresAt = this.chatConfigService.calculateExpirationDate(config);

    const message = new this.messageModel({
      channelId: new Types.ObjectId(dto.channelId),
      workspaceId: workspace.workspaceId
        ? new Types.ObjectId(workspace.workspaceId)
        : null,
      authorId: new Types.ObjectId(workspace.actorUserId),
      content: dto.content.trim(),
      mentionIds: (dto.mentionIds || []).map((id) => new Types.ObjectId(id)),
      expiresAt,
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
      workspaceId: workspace.workspaceId
        ? new Types.ObjectId(workspace.workspaceId)
        : null,
      deletedAt: null,
    };

    if (query.channelId) {
      filter.channelId = new Types.ObjectId(query.channelId);
    }

    if (query.before) {
      filter.createdAt = { $lt: new Date(query.before) };
    }

    if (query.after) {
      filter.createdAt = {
        ...(filter.createdAt || {}),
        $gt: new Date(query.after),
      };
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

    // Populate author information for all messages
    const itemsWithAuthors = await this.populateMessageAuthors(items);

    return {
      items: itemsWithAuthors,
      total,
      hasMore: total > skip + items.length,
    };
  }

  async findById(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<Message & { author?: UserDocument }> {
    const message = await this.messageModel
      .findOne({
        _id: new Types.ObjectId(id),
        workspaceId: workspace.workspaceId
          ? new Types.ObjectId(workspace.workspaceId)
          : null,
        deletedAt: null,
      })
      .exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Populate author information
    const [author] = await this.usersRepository.findByIds([message.authorId]);

    return { ...message.toObject(), author } as Message & {
      author?: UserDocument;
    };
  }

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const result = await this.messageModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          authorId: new Types.ObjectId(workspace.actorUserId),
          workspaceId: workspace.workspaceId
            ? new Types.ObjectId(workspace.workspaceId)
            : null,
        },
        { deletedAt: new Date() },
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Message not found or access denied');
    }
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    content: string,
  ): Promise<Message> {
    const result = await this.messageModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          authorId: new Types.ObjectId(workspace.actorUserId),
          workspaceId: workspace.workspaceId
            ? new Types.ObjectId(workspace.workspaceId)
            : null,
          deletedAt: null,
        },
        {
          content: content.trim(),
          editedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Message not found or access denied');
    }

    return result;
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

  /**
   * Populate author information for a list of messages
   * Efficiently batches the user lookup to avoid N+1 queries
   */
  private async populateMessageAuthors(
    messages: MessageDocument[],
  ): Promise<MessageDocument[]> {
    if (messages.length === 0) {
      return messages;
    }

    // Extract unique author IDs
    const authorIds = Array.from(
      new Set(messages.map((m) => m.authorId.toString())),
    );

    // Batch fetch all authors in a single query
    const authors = await this.usersRepository.findByIds(authorIds);
    const authorMap = new Map(
      authors.map((author) => [author._id.toString(), author]),
    );

    // Attach author information to each message
    return messages.map((message) => {
      const author = authorMap.get(message.authorId.toString());
      const messageObj = message.toObject ? message.toObject() : message;
      return Object.assign(message, { author }) as MessageDocument & {
        author?: UserDocument;
      };
    });
  }
}
