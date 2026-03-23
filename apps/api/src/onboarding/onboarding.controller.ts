import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/dto/auth-tokens.dto';
import { OnboardingSessionResponseDto } from './dto/onboarding-session-response.dto';
import { OnboardingStateResponseDto } from './dto/onboarding-state-response.dto';
import { UpdateOnboardingStepDto } from './dto/update-onboarding-step.dto';
import { OnboardingService } from './onboarding.service';
import { OnboardingStep } from './schemas/onboarding-session.schema';

@ApiTags('onboarding')
@ApiBearerAuth('access-token')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get onboarding state for the authenticated user',
  })
  @ApiOkResponse({ type: OnboardingStateResponseDto })
  getState(
    @CurrentUser() user: JwtPayload,
  ): Promise<OnboardingStateResponseDto> {
    return this.onboardingService.getState(user.sub);
  }

  @Post('start')
  @ApiOperation({
    summary: 'Start or resume onboarding for the authenticated user',
  })
  @ApiOkResponse({ type: OnboardingSessionResponseDto })
  start(
    @CurrentUser() user: JwtPayload,
  ): Promise<OnboardingSessionResponseDto> {
    return this.onboardingService.start(user.sub);
  }

  @Patch('steps/:step')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Persist a single onboarding step for the authenticated user',
  })
  @ApiBody({ type: UpdateOnboardingStepDto })
  @ApiOkResponse({ type: OnboardingSessionResponseDto })
  updateStep(
    @CurrentUser() user: JwtPayload,
    @Param('step', new ParseEnumPipe(OnboardingStep)) step: OnboardingStep,
    @Body() dto: UpdateOnboardingStepDto,
  ): Promise<OnboardingSessionResponseDto> {
    return this.onboardingService.updateStep(user.sub, step, dto);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete onboarding for the authenticated user',
  })
  @ApiOkResponse({ type: OnboardingSessionResponseDto })
  complete(
    @CurrentUser() user: JwtPayload,
  ): Promise<OnboardingSessionResponseDto> {
    return this.onboardingService.complete(user.sub);
  }
}
