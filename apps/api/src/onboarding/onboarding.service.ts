import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WorkspaceProvisioningService } from '../workspaces/workspace-provisioning.service';
import { OnboardingSessionResponseDto } from './dto/onboarding-session-response.dto';
import { OnboardingStateResponseDto } from './dto/onboarding-state-response.dto';
import {
  OnboardingStateStatus,
  OnboardingSummaryDto,
} from './dto/onboarding-summary.dto';
import { UpdateOnboardingStepDto } from './dto/update-onboarding-step.dto';
import {
  OnboardingSession,
  OnboardingSessionDocument,
  OnboardingStatus,
  OnboardingStep,
} from './schemas/onboarding-session.schema';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(OnboardingSession.name)
    private readonly onboardingSessionModel: Model<OnboardingSessionDocument>,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
    private readonly workspaceProvisioningService: WorkspaceProvisioningService,
  ) {}

  async getState(userId: string): Promise<OnboardingStateResponseDto> {
    const [user, session] = await Promise.all([
      this.usersService.findById(userId),
      this.findSession(userId),
    ]);
    const summary = this.buildSummary(user, session);

    return new OnboardingStateResponseDto({
      ...summary,
      session: session ? this.toResponseDto(session) : null,
    });
  }

  async getSummary(userId: string): Promise<OnboardingSummaryDto> {
    const [user, session] = await Promise.all([
      this.usersService.findById(userId),
      this.findSession(userId),
    ]);

    return this.buildSummary(user, session);
  }

  async start(userId: string): Promise<OnboardingSessionResponseDto> {
    const session = await this.ensureMutableSession(userId);
    return this.toResponseDto(session);
  }

  async updateStep(
    userId: string,
    step: OnboardingStep,
    dto: UpdateOnboardingStepDto,
  ): Promise<OnboardingSessionResponseDto> {
    const session = await this.ensureMutableSession(userId);

    if (session.status === OnboardingStatus.COMPLETED) {
      throw new ConflictException('Onboarding has already been completed');
    }

    const answers = this.mergeStepAnswers(session.answers, step, dto.answers);
    const completedSteps = dto.markComplete
      ? this.addCompletedStep(session.completedSteps, step)
      : session.completedSteps;

    const updatedSession = await this.onboardingSessionModel
      .findByIdAndUpdate(
        session._id,
        {
          $set: {
            answers,
            completedSteps,
            currentStep: dto.nextStep ?? step,
            status: OnboardingStatus.IN_PROGRESS,
            completedAt: null,
            startedAt: session.startedAt ?? new Date(),
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedSession) {
      throw new NotFoundException('Onboarding session could not be updated');
    }

    return this.toResponseDto(updatedSession);
  }

  async complete(userId: string): Promise<OnboardingSessionResponseDto> {
    const session = await this.ensureMutableSession(userId);

    if (session.status === OnboardingStatus.COMPLETED) {
      return this.toResponseDto(session);
    }

    const workspaceId = this.toIdString(session.workspaceId);
    if (!workspaceId) {
      throw new NotFoundException('Onboarding workspace could not be resolved');
    }

    const workspaceUpdate = this.extractWorkspaceUpdate(session.answers);
    if (workspaceUpdate) {
      await this.workspacesService.update(workspaceId, workspaceUpdate);
    }

    const completedSession = await this.onboardingSessionModel
      .findByIdAndUpdate(
        session._id,
        {
          $set: {
            status: OnboardingStatus.COMPLETED,
            currentStep: OnboardingStep.REVIEW,
            completedSteps: this.addCompletedStep(
              this.addCompletedStep(
                session.completedSteps,
                session.currentStep ?? OnboardingStep.REVIEW,
              ),
              OnboardingStep.REVIEW,
            ),
            completedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();

    if (!completedSession) {
      throw new NotFoundException('Onboarding session could not be completed');
    }

    return this.toResponseDto(completedSession);
  }

  private async ensureMutableSession(
    userId: string,
  ): Promise<OnboardingSessionDocument> {
    const workspace =
      await this.workspaceProvisioningService.ensureDefaultWorkspaceForUser(
        userId,
      );
    let session = await this.findSession(userId);

    if (!session) {
      session = await this.onboardingSessionModel.create({
        userId: new Types.ObjectId(userId),
        workspaceId: workspace._id,
        status: OnboardingStatus.IN_PROGRESS,
        currentStep: OnboardingStep.PROFILE,
        completedSteps: [],
        answers: {},
        version: 1,
        startedAt: new Date(),
      });
      return session;
    }

    const updates: Partial<OnboardingSession> = {};

    if (!session.workspaceId) {
      updates.workspaceId = workspace._id;
    }

    if (!session.startedAt && session.status === OnboardingStatus.IN_PROGRESS) {
      updates.startedAt = new Date();
    }

    if (Object.keys(updates).length === 0) {
      return session;
    }

    session = await this.onboardingSessionModel
      .findByIdAndUpdate(session._id, { $set: updates }, { new: true })
      .exec();

    if (!session) {
      throw new NotFoundException('Onboarding session could not be resolved');
    }

    return session;
  }

  private async findSession(
    userId: string,
  ): Promise<OnboardingSessionDocument | null> {
    return this.onboardingSessionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  private buildSummary(
    user: {
      defaultWorkspaceId?: { toString(): string } | null;
      activeWorkspaceId?: { toString(): string } | null;
    },
    session: OnboardingSessionDocument | null,
  ): OnboardingSummaryDto {
    const workspaceId =
      this.toIdString(session?.workspaceId) ??
      user.activeWorkspaceId?.toString() ??
      user.defaultWorkspaceId?.toString() ??
      null;

    if (!session) {
      const hasWorkspace = Boolean(workspaceId);
      return new OnboardingSummaryDto({
        status: hasWorkspace
          ? OnboardingStateStatus.COMPLETED
          : OnboardingStateStatus.NOT_STARTED,
        requiresOnboarding: !hasWorkspace,
        currentStep: hasWorkspace ? null : OnboardingStep.PROFILE,
        workspaceId,
      });
    }

    return new OnboardingSummaryDto({
      status: this.mapSessionStatus(session.status),
      requiresOnboarding: session.status === OnboardingStatus.IN_PROGRESS,
      currentStep:
        session.status === OnboardingStatus.IN_PROGRESS
          ? session.currentStep
          : null,
      workspaceId,
    });
  }

  private mergeStepAnswers(
    existingAnswers: Record<string, unknown> | undefined,
    step: OnboardingStep,
    nextAnswers?: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!nextAnswers || Object.keys(nextAnswers).length === 0) {
      return existingAnswers ?? {};
    }

    const answers = this.isRecord(existingAnswers)
      ? { ...existingAnswers }
      : {};
    const currentStepAnswers = this.isRecord(answers[step])
      ? answers[step]
      : {};

    return {
      ...answers,
      [step]: {
        ...currentStepAnswers,
        ...nextAnswers,
      },
    };
  }

  private addCompletedStep(
    completedSteps: string[] | undefined,
    step: OnboardingStep,
  ): string[] {
    return Array.from(new Set([...(completedSteps ?? []), step]));
  }

  private extractWorkspaceUpdate(
    answers: Record<string, unknown> | undefined,
  ): { name: string } | null {
    const workspaceAnswers = this.isRecord(answers?.[OnboardingStep.WORKSPACE])
      ? answers?.[OnboardingStep.WORKSPACE]
      : null;

    if (!this.isRecord(workspaceAnswers)) {
      return null;
    }

    const name =
      typeof workspaceAnswers.name === 'string'
        ? workspaceAnswers.name.trim()
        : '';

    if (!name) {
      return null;
    }

    return { name };
  }

  private mapSessionStatus(status: OnboardingStatus): OnboardingStateStatus {
    switch (status) {
      case OnboardingStatus.COMPLETED:
        return OnboardingStateStatus.COMPLETED;
      case OnboardingStatus.SKIPPED:
        return OnboardingStateStatus.SKIPPED;
      case OnboardingStatus.IN_PROGRESS:
      default:
        return OnboardingStateStatus.IN_PROGRESS;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toResponseDto(
    session: OnboardingSessionDocument | Record<string, unknown>,
  ): OnboardingSessionResponseDto {
    const rawSource =
      typeof (session as OnboardingSessionDocument).toObject === 'function'
        ? (session as OnboardingSessionDocument).toObject()
        : session;
    const raw = rawSource as Record<string, unknown>;

    return new OnboardingSessionResponseDto({
      id: this.toIdString(raw._id ?? raw.id) ?? '',
      userId: this.toIdString(raw.userId) ?? '',
      workspaceId: this.toIdString(raw.workspaceId),
      status: raw.status as OnboardingStatus,
      currentStep: raw.currentStep as OnboardingStep,
      completedSteps: Array.isArray(raw.completedSteps)
        ? raw.completedSteps.filter(
            (step): step is string => typeof step === 'string',
          )
        : [],
      answers:
        raw.answers && typeof raw.answers === 'object'
          ? (raw.answers as Record<string, unknown>)
          : {},
      version: typeof raw.version === 'number' ? raw.version : 1,
      startedAt: (raw.startedAt as Date | null | undefined) ?? null,
      completedAt: (raw.completedAt as Date | null | undefined) ?? null,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    });
  }

  private toIdString(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && 'toString' in value) {
      return value.toString();
    }
    return null;
  }
}
