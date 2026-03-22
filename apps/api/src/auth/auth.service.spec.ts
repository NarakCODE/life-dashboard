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
});
