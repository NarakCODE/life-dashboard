import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChannelDocument = HydratedDocument<Channel>;

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DM = 'dm',
}

@Schema({ timestamps: true, collection: 'chat_channels' })
export class Channel {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({ required: true, enum: Object.values(ChannelType) })
  type: ChannelType;

  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  memberIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  lastMessageId?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  lastMessageAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);

ChannelSchema.index({ workspaceId: 1, type: 1, updatedAt: -1 });
ChannelSchema.index({ memberIds: 1, updatedAt: -1 });
ChannelSchema.index({ workspaceId: 1, lastMessageAt: -1 });
