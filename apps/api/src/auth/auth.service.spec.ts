import { AuthService } from './auth.service';
import { NotFoundException } from '@nestjs/common';

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
    const workspacesService = {
      ensureDefaultWorkspaceForUser: jest.fn().mockResolvedValue(undefined),
    };

    const service = new AuthService(
      usersService as never,
      usersRepo as never,
      otpCodesService as never,
      emailService as never,
      jwtService as never,
      config as never,
      workspacesService as never,
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

  it('bootstraps a verified local development session', async () => {
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
    const workspacesService = {
      ensureDefaultWorkspaceForUser: jest.fn().mockResolvedValue(undefined),
    };

    const service = new AuthService(
      usersService as never,
      usersRepo as never,
      otpCodesService as never,
      emailService as never,
      jwtService as never,
      config as never,
      workspacesService as never,
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
    expect(
      workspacesService.ensureDefaultWorkspaceForUser,
    ).toHaveBeenCalledWith(userId);
    expect(usersRepo.updateRefreshTokenHash).toHaveBeenCalledTimes(1);
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
