import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  OnboardingStatus,
  OnboardingStep,
} from '../schemas/onboarding-session.schema';

export enum OnboardingStateStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = OnboardingStatus.IN_PROGRESS,
  COMPLETED = OnboardingStatus.COMPLETED,
  SKIPPED = OnboardingStatus.SKIPPED,
}

export class OnboardingSummaryDto {
  @Expose()
  @ApiProperty({ enum: Object.values(OnboardingStateStatus) })
  status: OnboardingStateStatus;

  @Expose()
  @ApiProperty()
  requiresOnboarding: boolean;

  @Expose()
  @ApiProperty({
    enum: Object.values(OnboardingStep),
    required: false,
    nullable: true,
  })
  currentStep?: OnboardingStep | null;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  workspaceId?: string | null;

  constructor(partial: Partial<OnboardingSummaryDto>) {
    Object.assign(this, partial);
  }
}
