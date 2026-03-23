import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional } from 'class-validator';
import { OnboardingStep } from '../schemas/onboarding-session.schema';

export class UpdateOnboardingStepDto {
  @ApiProperty({
    required: false,
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  answers?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    enum: Object.values(OnboardingStep),
  })
  @IsOptional()
  @IsEnum(OnboardingStep)
  nextStep?: OnboardingStep;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  markComplete?: boolean;
}
