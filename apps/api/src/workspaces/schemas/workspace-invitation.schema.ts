import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { WorkspaceRole } from './workspace.schema';

export type WorkspaceInvitationDocument = HydratedDocument<WorkspaceInvitation>;

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true, collection: 'workspace_invitations' })
export class WorkspaceInvitation {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(WorkspaceRole),
  })
  role: WorkspaceRole;

  @Prop({
    required: true,
    enum: Object.values(InvitationStatus),
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const WorkspaceInvitationSchema = SchemaFactory.createForClass(WorkspaceInvitation);
