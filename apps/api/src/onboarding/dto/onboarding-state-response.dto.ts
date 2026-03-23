import { ApiProperty } from '@nestjs/swagger';
import { OnboardingSessionResponseDto } from './onboarding-session-response.dto';
import { OnboardingSummaryDto } from './onboarding-summary.dto';

export class OnboardingStateResponseDto extends OnboardingSummaryDto {
  @ApiProperty({
    type: () => OnboardingSessionResponseDto,
    required: false,
    nullable: true,
  })
  session: OnboardingSessionResponseDto | null;

  constructor(partial: Partial<OnboardingStateResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
