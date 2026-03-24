import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OnboardingSessionDocument = HydratedDocument<OnboardingSession>;

export enum OnboardingStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export enum OnboardingStep {
  PROFILE = 'profile',
  WORKSPACE = 'workspace',
  PREFERENCES = 'preferences',
  INVITES = 'invites',
  REVIEW = 'review',
}

@Schema({ timestamps: true, collection: 'onboarding_sessions' })
export class OnboardingSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null, index: true })
  workspaceId?: Types.ObjectId | null;

  @Prop({
    required: true,
    enum: Object.values(OnboardingStatus),
    default: OnboardingStatus.IN_PROGRESS,
    index: true,
  })
  status!: OnboardingStatus;

  @Prop({
    required: true,
    enum: Object.values(OnboardingStep),
    default: OnboardingStep.PROFILE,
  })
  currentStep!: OnboardingStep;

  @Prop({ type: [String], default: [] })
  completedSteps!: string[];

  @Prop({ type: Object, default: {} })
  answers!: Record<string, unknown>;

  @Prop({ required: true, default: 1 })
  version!: number;

  @Prop({ type: Date, default: null })
  startedAt?: Date | null;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OnboardingSessionSchema =
  SchemaFactory.createForClass(OnboardingSession);
