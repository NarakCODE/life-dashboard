import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

@Schema({ _id: false })
export class WorkspaceMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(WorkspaceRole),
  })
  role: WorkspaceRole;
}

export const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);

@Schema({ timestamps: true, collection: 'workspaces' })
export class Workspace {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [WorkspaceMemberSchema], default: [] })
  members: WorkspaceMember[];

  createdAt: Date;
  updatedAt: Date;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
WorkspaceSchema.index({ 'members.userId': 1 });
