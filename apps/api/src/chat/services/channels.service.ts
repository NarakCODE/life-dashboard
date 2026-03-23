import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Channel, ChannelDocument, ChannelType } from '../schemas/channel.schema';
import { ChannelMember } from '../schemas/channel-member.schema';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { WorkspaceRequestContext } from '../../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name) private readonly channelModel: Model<ChannelDocument>,
    @InjectModel(ChannelMember.name) private readonly channelMemberModel: Model<ChannelMember>,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateChannelDto,
  ): Promise<Channel> {
    // Build member list
    const memberIds = [...new Set(dto.memberIds || [])];
    
    // DM requires exactly 2 members
    if (dto.type === ChannelType.DM && memberIds.length !== 2) {
      throw new ForbiddenException('DM channels require exactly 2 members');
    }

    // Add creator to members for private channels
    if (dto.type === ChannelType.PRIVATE && !memberIds.includes(workspace.actorUserId)) {
      memberIds.push(workspace.actorUserId);
    }

    const channel = new this.channelModel({
      workspaceId: workspace.workspaceId ? new Types.ObjectId(workspace.workspaceId) : null,
      type: dto.type,
      name: dto.name,
      description: dto.description,
      memberIds: memberIds.map(id => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(workspace.actorUserId),
    });

    const saved = await channel.save();

    // Create ChannelMember entries for all members
    const channelMembers = memberIds.map(userId => ({
      channelId: saved._id,
      userId: new Types.ObjectId(userId),
      unreadCount: 0,
      joinedAt: new Date(),
    }));

    await this.channelMemberModel.insertMany(channelMembers);

    return saved;
  }

  async findMany(
    workspace: WorkspaceRequestContext,
  ): Promise<Channel[]> {
    const query: Record<string, unknown> = {
      workspaceId: workspace.workspaceId ? new Types.ObjectId(workspace.workspaceId) : null,
    };

    // For non-public channels, only show if user is a member
    query.$or = [
      { type: ChannelType.PUBLIC },
      { memberIds: { $in: [new Types.ObjectId(workspace.actorUserId)] } },
    ];

    return this.channelModel
      .find(query)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .exec();
  }

  async findById(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<Channel> {
    const channel = await this.channelModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: workspace.workspaceId ? new Types.ObjectId(workspace.workspaceId) : null,
    }).exec();

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check access for non-public channels
    if (channel.type !== ChannelType.PUBLIC) {
      const isMember = channel.memberIds.some(
        memberId => memberId.toString() === workspace.actorUserId,
      );
      if (!isMember) {
        throw new ForbiddenException('Access denied');
      }
    }

    return channel;
  }

  async canAccess(
    userId: string,
    channelId: string,
    workspaceId?: string | null,
  ): Promise<boolean> {
    const channel = await this.channelModel.findById(channelId).exec();
    if (!channel) return false;

    // Check workspace match
    if (workspaceId && channel.workspaceId?.toString() !== workspaceId) {
      return false;
    }

    // Public channels are accessible
    if (channel.type === ChannelType.PUBLIC) return true;

    // Check membership
    return channel.memberIds.some(
      memberId => memberId.toString() === userId,
    );
  }

  async updateLastMessage(
    channelId: string,
    messageId: string,
  ): Promise<void> {
    await this.channelModel.findByIdAndUpdate(channelId, {
      lastMessageId: new Types.ObjectId(messageId),
      lastMessageAt: new Date(),
    });
  }
}
