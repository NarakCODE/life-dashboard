import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChannelMemberDocument = HydratedDocument<ChannelMember>;

@Schema({ timestamps: true, collection: 'chat_channel_members' })
export class ChannelMember {
  @Prop({ type: Types.ObjectId, ref: 'Channel', required: true, index: true })
  channelId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  lastReadMessageId?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  lastReadAt?: Date;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ChannelMemberSchema = SchemaFactory.createForClass(ChannelMember);

ChannelMemberSchema.index({ channelId: 1, userId: 1 }, { unique: true });
ChannelMemberSchema.index({ userId: 1, unreadCount: -1 });
