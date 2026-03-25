import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatConfig, ChatConfigDocument, AutoDeletePreset } from '../schemas/chat-config.schema';

export interface UpdateChatConfigDto {
  autoDeletePreset?: AutoDeletePreset;
  autoDeleteCustomSeconds?: number | null;
  autoDeleteForAllUsers?: boolean;
  notifyBeforeDeletion?: boolean;
}

@Injectable()
export class ChatConfigService {
  constructor(
    @InjectModel(ChatConfig.name)
    private readonly chatConfigModel: Model<ChatConfigDocument>,
  ) {}

  /**
   * Get or create chat config for a workspace
   */
  async getConfig(workspaceId: string): Promise<ChatConfig> {
    let config = await this.chatConfigModel
      .findOne({ workspaceId: new Types.ObjectId(workspaceId) })
      .exec();

    if (!config) {
      // Create default config if not exists
      config = new this.chatConfigModel({
        workspaceId: new Types.ObjectId(workspaceId),
        autoDeletePreset: AutoDeletePreset.OFF,
        autoDeleteCustomSeconds: null,
        autoDeleteForAllUsers: false,
        notifyBeforeDeletion: true,
      });
      await config.save();
    }

    return config;
  }

  /**
   * Update chat config for a workspace
   */
  async updateConfig(
    workspaceId: string,
    dto: UpdateChatConfigDto,
  ): Promise<ChatConfig> {
    const config = await this.chatConfigModel
      .findOneAndUpdate(
        { workspaceId: new Types.ObjectId(workspaceId) },
        { $set: dto },
        { new: true, upsert: true },
      )
      .exec();

    if (!config) {
      throw new NotFoundException('Chat config not found');
    }

    return config;
  }

  /**
   * Calculate expiration date based on config
   */
  calculateExpirationDate(
    config: ChatConfig,
    createdAt: Date = new Date(),
  ): Date | null {
    if (config.autoDeletePreset === AutoDeletePreset.OFF) {
      return null;
    }

    let seconds: number | null = null;

    if (config.autoDeletePreset === AutoDeletePreset.CUSTOM) {
      seconds = config.autoDeleteCustomSeconds;
    } else {
      const presetSeconds: Record<string, number> = {
        '1h': 3600,
        '1d': 86400,
        '7d': 604800,
        '30d': 2592000,
      };
      seconds = presetSeconds[config.autoDeletePreset] || null;
    }

    if (!seconds || seconds <= 0) {
      return null;
    }

    return new Date(createdAt.getTime() + seconds * 1000);
  }
}
