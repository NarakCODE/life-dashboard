import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('reuses the existing refresh token when refreshing a session', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const existingRefreshToken = 'existing-refresh-token';

    const usersService = {
      findById: jest.fn().mockResolvedValue({
        _id: { toString: () => userId },
        email: 'user@example.com',
        displayName: 'User',
        isEmailVerified: true,
        defaultWorkspaceId: null,
        activeWorkspaceId: null,
      }),
    };
    const usersRepo = {
      updateRefreshTokenHash: jest.fn(),
    };
    const otpCodesService = {};
    const emailService = {};
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('new-access-token'),
    };
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'jwt.expiresIn') return '15m';
        if (key === 'jwt.secret') return 'access-secret';
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        if (key === 'jwt.refreshExpiresIn') return '7d';
        return fallback;
      }),
    };
    const onboardingService = {
      getSummary: jest.fn(),
    };

    const service = new AuthService(
      usersService as never,
      usersRepo as never,
      otpCodesService as never,
      emailService as never,
      jwtService as never,
      config as never,
      onboardingService as never,
    );

    await expect(
      service.refresh(userId, existingRefreshToken),
    ).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: existingRefreshToken,
      expiresIn: 900,
    });

    expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
    expect(usersRepo.updateRefreshTokenHash).not.toHaveBeenCalled();
  });

  it('bootstraps a verified local development session without provisioning a workspace', async () => {
    const userId = '507f1f77bcf86cd799439012';
    const createdUser = {
      _id: { toString: () => userId },
      email: 'dev@life-dashboard.local',
      displayName: 'Local Dev User',
      isEmailVerified: false,
      defaultWorkspaceId: null,
      activeWorkspaceId: null,
    };
    const verifiedUser = {
      ...createdUser,
      isEmailVerified: true,
    };

    const usersService = {
      findById: jest.fn().mockResolvedValue(verifiedUser),
      findByEmail: jest.fn().mockResolvedValueOnce(null),
      create: jest.fn().mockResolvedValue(createdUser),
      markEmailVerified: jest.fn().mockResolvedValue(undefined),
    };
    const usersRepo = {
      updateRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    };
    const otpCodesService = {};
    const emailService = {};
    const jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('dev-access-token')
        .mockResolvedValueOnce('dev-refresh-token'),
    };
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'app.nodeEnv') return 'development';
        if (key === 'jwt.expiresIn') return '15m';
        if (key === 'jwt.secret') return 'access-secret';
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        if (key === 'jwt.refreshExpiresIn') return '7d';
        return fallback;
      }),
    };
    const onboardingService = {
      getSummary: jest.fn(),
    };

    const service = new AuthService(
      usersService as never,
      usersRepo as never,
      otpCodesService as never,
      emailService as never,
      jwtService as never,
      config as never,
      onboardingService as never,
    );

    await expect(service.devBootstrap()).resolves.toEqual({
      accessToken: 'dev-access-token',
      refreshToken: 'dev-refresh-token',
      expiresIn: 900,
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'dev@life-dashboard.local',
        displayName: 'Local Dev User',
      }),
    );
    expect(usersService.markEmailVerified).toHaveBeenCalledWith(userId);
    expect(usersRepo.updateRefreshTokenHash).toHaveBeenCalledTimes(1);
  });

  it('registers a user without provisioning a workspace yet', async () => {
    const userId = '507f1f77bcf86cd799439099';
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        _id: { toString: () => userId },
        email: 'new@example.com',
        displayName: 'New User',
      }),
    };
    const usersRepo = {};
    const otpCodesService = {
      generate: jest.fn().mockResolvedValue('123456'),
    };
    const emailService = {
      sendEmailVerification: jest.fn().mockResolvedValue(undefined),
    };
    const jwtService = {};
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'jwt.expiresIn') return '15m';
        return fallback;
      }),
    };
    const onboardingService = {
      getSummary: jest.fn(),
    };

    const service = new AuthService(
      usersService as never,
      usersRepo as never,
      otpCodesService as never,
      emailService as never,
      jwtService as never,
      config as never,
      onboardingService as never,
    );

    await expect(
      service.register({
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
      }),
    ).resolves.toEqual({
      message:
        'Registration successful. Please check your email for the verification code.',
    });

    expect(emailService.sendEmailVerification).toHaveBeenCalledWith({
      to: { email: 'new@example.com', name: 'New User' },
      code: '123456',
    });
  });

  it('returns onboarding state from getMe without provisioning a workspace', async () => {
    const userId = '507f1f77bcf86cd799439088';
    const usersService = {
      findById: jest.fn().mockResolvedValue({
        _id: { toString: () => userId },
        email: 'user@example.com',
        displayName: 'User',
        isEmailVerified: true,
        defaultWorkspaceId: null,
        activeWorkspaceId: null,
        createdAt: new Date('2026-03-23T00:00:00.000Z'),
        updatedAt: new Date('2026-03-23T00:00:00.000Z'),
      }),
    };
    const onboardingSummary = {
      status: 'not_started',
      requiresOnboarding: true,
      currentStep: 'profile',
      workspaceId: null,
    };
    const onboardingService = {
      getSummary: jest.fn().mockResolvedValue(onboardingSummary),
    };

    const service = new AuthService(
      usersService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        get: jest.fn((key: string, fallback?: string) => {
          if (key === 'jwt.expiresIn') return '15m';
          return fallback;
        }),
      } as never,
      onboardingService as never,
    );

    await expect(service.getMe(userId)).resolves.toEqual({
      id: userId,
      email: 'user@example.com',
      displayName: 'User',
      isEmailVerified: true,
      defaultWorkspaceId: null,
      activeWorkspaceId: null,
      onboarding: onboardingSummary,
      createdAt: new Date('2026-03-23T00:00:00.000Z'),
      updatedAt: new Date('2026-03-23T00:00:00.000Z'),
    });

    expect(onboardingService.getSummary).toHaveBeenCalledWith(userId);
  });

  it('hides dev bootstrap outside development', async () => {
    const service = new AuthService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        get: jest.fn((key: string, fallback?: string) => {
          if (key === 'app.nodeEnv') return 'production';
          if (key === 'jwt.expiresIn') return '15m';
          return fallback;
        }),
      } as never,
      {} as never,
    );

    await expect(service.devBootstrap()).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
