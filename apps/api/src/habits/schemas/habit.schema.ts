import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HabitDocument = HydratedDocument<Habit>;

export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true, collection: 'habits' })
export class Habit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    required: true,
    enum: Object.values(HabitFrequency),
    default: HabitFrequency.DAILY,
  })
  frequency: HabitFrequency;

  @Prop({ type: [Number], default: [] })
  customDays: number[];

  @Prop({ min: 1, default: 1 })
  targetCount: number;

  @Prop({ default: '#6b7280' })
  color: string;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const HabitSchema = SchemaFactory.createForClass(Habit);

HabitSchema.index({ userId: 1, isActive: 1 });
