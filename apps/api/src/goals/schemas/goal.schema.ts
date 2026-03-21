import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GoalDocument = HydratedDocument<Goal>;

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  PAUSED = 'paused',
}

@Schema({ _id: true, timestamps: false })
export class ProgressLog {
  @Prop({ required: true })
  value: number;

  @Prop({ trim: true })
  note?: string;

  @Prop({ required: true, default: Date.now })
  loggedAt: Date;
}

export const ProgressLogSchema = SchemaFactory.createForClass(ProgressLog);

@Schema({ timestamps: true, collection: 'goals' })
export class Goal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, min: 0 })
  targetValue: number;

  @Prop({ default: 0, min: 0 })
  currentValue: number;

  @Prop({ trim: true })
  unit?: string;

  @Prop()
  deadline?: Date;

  @Prop({
    required: true,
    enum: Object.values(GoalStatus),
    default: GoalStatus.ACTIVE,
    index: true,
  })
  status: GoalStatus;

  @Prop({ type: [ProgressLogSchema], default: [] })
  progressLogs: ProgressLog[];

  get progressPercent(): number {
    if (!this.targetValue) return 0;
    return Math.min(
      Math.round((this.currentValue / this.targetValue) * 100),
      100,
    );
  }

  createdAt: Date;
  updatedAt: Date;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);

GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, deadline: 1 });
GoalSchema.set('toJSON', { virtuals: true });
GoalSchema.set('toObject', { virtuals: true });
