import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  ARCHIVED = 'archived',
}

export enum TaskPriority {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
}

@Schema({ _id: true, timestamps: false })
export class TaskTag {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '#6b7280' })
  color: string;
}

export const TaskTagSchema = SchemaFactory.createForClass(TaskTag);

@Schema({ timestamps: true, collection: 'tasks' })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    required: true,
    enum: Object.values(TaskStatus),
    default: TaskStatus.TODO,
    index: true,
  })
  status: TaskStatus;

  @Prop({
    min: 0,
    max: 4,
    default: TaskPriority.NONE,
  })
  priority: TaskPriority;

  @Prop()
  dueDate?: Date;

  @Prop({ default: null })
  completedAt?: Date;

  @Prop({ type: [TaskTagSchema], default: [] })
  tags: TaskTag[];

  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, priority: -1 });
TaskSchema.index({ userId: 1, 'tags.name': 1 });
