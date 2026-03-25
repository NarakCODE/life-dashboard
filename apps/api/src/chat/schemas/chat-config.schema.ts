import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatConfigDocument = HydratedDocument<ChatConfig>;

export enum AutoDeletePreset {
  OFF = 'off',
  ONE_HOUR = '1h',
  ONE_DAY = '1d',
  ONE_WEEK = '7d',
  ONE_MONTH = '30d',
  CUSTOM = 'custom',
}

@Schema({ 
  timestamps: true, 
  collection: 'chat_configs',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class ChatConfig {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, unique: true })
  workspaceId!: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(AutoDeletePreset),
    default: AutoDeletePreset.OFF,
  })
  autoDeletePreset!: AutoDeletePreset;

  @Prop({ type: Number, default: null })
  autoDeleteCustomSeconds!: number | null;

  @Prop({ type: Boolean, default: false })
  autoDeleteForAllUsers!: boolean;

  @Prop({ type: Boolean, default: true })
  notifyBeforeDeletion!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ChatConfigSchema = SchemaFactory.createForClass(ChatConfig);

// Virtual to get auto-delete duration in seconds
ChatConfigSchema.virtual('autoDeleteSeconds').get(function() {
  if (this.autoDeletePreset === AutoDeletePreset.OFF) {
    return null;
  }
  if (this.autoDeletePreset === AutoDeletePreset.CUSTOM) {
    return this.autoDeleteCustomSeconds;
  }
  
  const presetSeconds: Record<string, number> = {
    '1h': 3600,
    '1d': 86400,
    '7d': 604800,
    '30d': 2592000,
  };
  
  return presetSeconds[this.autoDeletePreset] || null;
});

// Index for efficient queries
ChatConfigSchema.index({ workspaceId: 1 });
