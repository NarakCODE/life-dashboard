import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  ARCHIVED = 'archived',
}

export enum TaskPriority {
  NONE = 'no-priority',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ _id: false, timestamps: false })
export class TaskAssigneeSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({ trim: true })
  role?: string;
}

export const TaskAssigneeSnapshotSchema =
  SchemaFactory.createForClass(TaskAssigneeSnapshot);

@Schema({ timestamps: true, collection: 'tasks' })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    required: true,
    enum: Object.values(TaskStatus),
    default: TaskStatus.TODO,
    index: true,
  })
  status: TaskStatus;

  // Denormalized project metadata keeps the tasks API usable until a
  // dedicated projects/workstreams backend exists.
  @Prop({ required: true, trim: true, index: true })
  projectId: string;

  @Prop({ required: true, trim: true })
  projectName: string;

  @Prop({ trim: true })
  workstreamId?: string;

  @Prop({ trim: true })
  workstreamName?: string;

  @Prop({ type: TaskAssigneeSnapshotSchema, default: null })
  assignee?: TaskAssigneeSnapshot | null;

  @Prop()
  startDate?: Date;

  @Prop({
    enum: Object.values(TaskPriority),
    default: TaskPriority.NONE,
  })
  priority: TaskPriority;

  @Prop()
  tag?: string;

  @Prop()
  dueDate?: Date;

  @Prop({ default: null })
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, projectId: 1 });
TaskSchema.index({ userId: 1, startDate: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, tag: 1 });
TaskSchema.index({ userId: 1, 'assignee.id': 1 });
