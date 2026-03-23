import { Types } from 'mongoose';
import { OnboardingService } from './onboarding.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { WorkspaceRole } from '../workspaces/schemas/workspace.schema';
import {
  OnboardingStatus,
  OnboardingStep,
} from './schemas/onboarding-session.schema';

describe('OnboardingService', () => {
  it('starts onboarding by provisioning a workspace and creating a session', async () => {
    const userId = new Types.ObjectId().toString();
    const workspaceId = new Types.ObjectId();
    const sessionId = new Types.ObjectId();
    const now = new Date('2026-03-23T10:00:00.000Z');

    const onboardingSessionModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      create: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: sessionId,
          userId: new Types.ObjectId(userId),
          workspaceId,
          status: OnboardingStatus.IN_PROGRESS,
          currentStep: OnboardingStep.PROFILE,
          completedSteps: [],
          answers: {},
          version: 1,
          startedAt: now,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      }),
    };
    const usersService = {
      findById: jest.fn(),
    };
    const workspacesService = {
      update: jest.fn(),
    };
    const notificationsService = {
      createForRecipient: jest.fn(),
    };
    const workspaceProvisioningService = {
      ensureDefaultWorkspaceForUser: jest.fn().mockResolvedValue({
        _id: workspaceId,
      }),
    };

    const service = new OnboardingService(
      onboardingSessionModel as never,
      usersService as never,
      notificationsService as never,
      workspacesService as never,
      workspaceProvisioningService as never,
    );

    await expect(service.start(userId)).resolves.toEqual({
      id: sessionId.toString(),
      userId,
      workspaceId: workspaceId.toString(),
      status: OnboardingStatus.IN_PROGRESS,
      currentStep: OnboardingStep.PROFILE,
      completedSteps: [],
      answers: {},
      version: 1,
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    expect(
      workspaceProvisioningService.ensureDefaultWorkspaceForUser,
    ).toHaveBeenCalledWith(userId);
    expect(onboardingSessionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId,
        status: OnboardingStatus.IN_PROGRESS,
        currentStep: OnboardingStep.PROFILE,
      }),
    );
  });

  it('returns completed onboarding state for a legacy user with an existing workspace', async () => {
    const userId = new Types.ObjectId().toString();
    const workspaceId = new Types.ObjectId().toString();

    const onboardingSessionModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    };
    const usersService = {
      findById: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(userId),
        defaultWorkspaceId: { toString: () => workspaceId },
        activeWorkspaceId: null,
      }),
    };

    const service = new OnboardingService(
      onboardingSessionModel as never,
      usersService as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.getState(userId)).resolves.toEqual({
      status: OnboardingStatus.COMPLETED,
      requiresOnboarding: false,
      currentStep: null,
      workspaceId,
      session: null,
    });
  });

  it('persists onboarding step answers and completed steps', async () => {
    const userId = new Types.ObjectId().toString();
    const workspaceId = new Types.ObjectId();
    const sessionId = new Types.ObjectId();
    const now = new Date('2026-03-23T10:00:00.000Z');

    const existingSession = {
      _id: sessionId,
      userId: new Types.ObjectId(userId),
      workspaceId,
      status: OnboardingStatus.IN_PROGRESS,
      currentStep: OnboardingStep.PROFILE,
      completedSteps: [],
      answers: {},
      version: 1,
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const updatedSession = {
      ...existingSession,
      currentStep: OnboardingStep.WORKSPACE,
      completedSteps: [OnboardingStep.PROFILE],
      answers: {
        [OnboardingStep.PROFILE]: {
          displayName: 'Narak',
        },
      },
    };

    const onboardingSessionModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingSession),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          toObject: () => updatedSession,
        }),
      }),
    };
    const workspaceProvisioningService = {
      ensureDefaultWorkspaceForUser: jest.fn().mockResolvedValue({
        _id: workspaceId,
      }),
    };

    const service = new OnboardingService(
      onboardingSessionModel as never,
      {} as never,
      {} as never,
      {} as never,
      workspaceProvisioningService as never,
    );

    await expect(
      service.updateStep(userId, OnboardingStep.PROFILE, {
        answers: { displayName: 'Narak' },
        nextStep: OnboardingStep.WORKSPACE,
        markComplete: true,
      }),
    ).resolves.toEqual({
      id: sessionId.toString(),
      userId,
      workspaceId: workspaceId.toString(),
      status: OnboardingStatus.IN_PROGRESS,
      currentStep: OnboardingStep.WORKSPACE,
      completedSteps: [OnboardingStep.PROFILE],
      answers: {
        [OnboardingStep.PROFILE]: {
          displayName: 'Narak',
        },
      },
      version: 1,
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('completes onboarding and applies workspace basics from saved answers', async () => {
    const userId = new Types.ObjectId().toString();
    const workspaceId = new Types.ObjectId();
    const sessionId = new Types.ObjectId();
    const now = new Date('2026-03-23T10:00:00.000Z');

    const existingSession = {
      _id: sessionId,
      userId: new Types.ObjectId(userId),
      workspaceId,
      status: OnboardingStatus.IN_PROGRESS,
      currentStep: OnboardingStep.REVIEW,
      completedSteps: [OnboardingStep.PROFILE, OnboardingStep.WORKSPACE],
      answers: {
        [OnboardingStep.INVITES]: {
          invitees: ['invitee@example.com', 'missing@example.com'],
        },
        [OnboardingStep.WORKSPACE]: {
          name: 'Personal HQ',
        },
      },
      version: 1,
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const completedSession = {
      ...existingSession,
      status: OnboardingStatus.COMPLETED,
      completedSteps: [
        OnboardingStep.PROFILE,
        OnboardingStep.WORKSPACE,
        OnboardingStep.REVIEW,
      ],
      completedAt: now,
      updatedAt: now,
    };

    const onboardingSessionModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingSession),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          toObject: () => completedSession,
        }),
      }),
    };
    const workspacesService = {
      update: jest.fn().mockResolvedValue(undefined),
      inviteMember: jest
        .fn()
        .mockResolvedValueOnce({ id: new Types.ObjectId().toString() })
        .mockResolvedValueOnce({ id: new Types.ObjectId().toString() }),
      findOne: jest.fn().mockResolvedValue({
        id: workspaceId.toString(),
        name: 'Personal HQ',
      }),
    };
    const usersService = {
      findById: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(userId),
        email: 'owner@example.com',
        displayName: 'Narak',
      }),
      findByEmail: jest
        .fn()
        .mockResolvedValueOnce({
          _id: new Types.ObjectId(),
          email: 'invitee@example.com',
          displayName: 'Invitee',
        })
        .mockResolvedValueOnce(null),
    };
    const notificationsService = {
      createForRecipient: jest.fn().mockResolvedValue(undefined),
    };
    const workspaceProvisioningService = {
      ensureDefaultWorkspaceForUser: jest.fn().mockResolvedValue({
        _id: workspaceId,
      }),
    };

    const service = new OnboardingService(
      onboardingSessionModel as never,
      usersService as never,
      notificationsService as never,
      workspacesService as never,
      workspaceProvisioningService as never,
    );

    await expect(service.complete(userId)).resolves.toEqual({
      id: sessionId.toString(),
      userId,
      workspaceId: workspaceId.toString(),
      status: OnboardingStatus.COMPLETED,
      currentStep: OnboardingStep.REVIEW,
      completedSteps: [
        OnboardingStep.PROFILE,
        OnboardingStep.WORKSPACE,
        OnboardingStep.REVIEW,
      ],
      answers: {
        [OnboardingStep.INVITES]: {
          invitees: ['invitee@example.com', 'missing@example.com'],
        },
        [OnboardingStep.WORKSPACE]: {
          name: 'Personal HQ',
        },
      },
      version: 1,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    expect(workspacesService.update).toHaveBeenCalledWith(
      workspaceId.toString(),
      { name: 'Personal HQ' },
    );
    expect(workspacesService.inviteMember).toHaveBeenNthCalledWith(
      1,
      workspaceId.toString(),
      userId,
      {
        email: 'invitee@example.com',
        role: WorkspaceRole.MEMBER,
      },
    );
    expect(workspacesService.inviteMember).toHaveBeenNthCalledWith(
      2,
      workspaceId.toString(),
      userId,
      {
        email: 'missing@example.com',
        role: WorkspaceRole.MEMBER,
      },
    );
    expect(notificationsService.createForRecipient).toHaveBeenCalledTimes(1);
    expect(notificationsService.createForRecipient).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        type: NotificationType.SYSTEM,
        title: 'Workspace invitation: Personal HQ',
        body: 'Narak invited you to join Personal HQ.',
        data: expect.objectContaining({
          workspaceId: workspaceId.toString(),
          workspaceName: 'Personal HQ',
          inviteeEmail: 'invitee@example.com',
          invitedBy: 'Narak',
        }),
      }),
      {
        workspaceId: null,
        createdByUserId: userId,
      },
    );
  });
});
