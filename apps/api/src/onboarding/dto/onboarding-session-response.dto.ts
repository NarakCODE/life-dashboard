import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  OnboardingStatus,
  OnboardingStep,
} from '../schemas/onboarding-session.schema';

@Exclude()
export class OnboardingSessionResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty({ nullable: true })
  workspaceId?: string | null;

  @Expose()
  @ApiProperty({ enum: OnboardingStatus })
  status: OnboardingStatus;

  @Expose()
  @ApiProperty({ enum: OnboardingStep })
  currentStep: OnboardingStep;

  @Expose()
  @ApiProperty({ type: [String] })
  completedSteps: string[];

  @Expose()
  @ApiProperty({ type: Object })
  answers: Record<string, unknown>;

  @Expose()
  @ApiProperty()
  version: number;

  @Expose()
  @ApiProperty({ nullable: true })
  startedAt?: Date | null;

  @Expose()
  @ApiProperty({ nullable: true })
  completedAt?: Date | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<OnboardingSessionResponseDto>) {
    Object.assign(this, partial);
  }
}
