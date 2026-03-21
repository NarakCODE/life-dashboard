import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type JournalEntryDocument = HydratedDocument<JournalEntry>;

export enum MoodLevel {
  VERY_BAD = 1,
  BAD = 2,
  NEUTRAL = 3,
  GOOD = 4,
  VERY_GOOD = 5,
}

@Schema({ timestamps: true, collection: 'journal_entries' })
export class JournalEntry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ trim: true })
  title?: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    min: MoodLevel.VERY_BAD,
    max: MoodLevel.VERY_GOOD,
    default: null,
  })
  mood?: MoodLevel;

  @Prop({ type: [String], default: [] })
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const JournalEntrySchema = SchemaFactory.createForClass(JournalEntry);

JournalEntrySchema.index({ content: 'text', title: 'text' });
JournalEntrySchema.index({ userId: 1, createdAt: -1 });
JournalEntrySchema.index({ userId: 1, mood: 1 });
JournalEntrySchema.index({ userId: 1, tags: 1 });
