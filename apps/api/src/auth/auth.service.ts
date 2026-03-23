import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { OtpCodesService } from '../otp-codes/otp-codes.service';
import { BrevoEmailService } from '../email/brevo-email.service';
import { OtpType } from '../otp-codes/schemas/otp-code.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokensDto, JwtPayload } from './dto/auth-tokens.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';

const BCRYPT_ROUNDS = 10;
const DEV_BOOTSTRAP_EMAIL = 'dev@life-dashboard.local';
const DEV_BOOTSTRAP_PASSWORD = 'dev-bootstrap-password';
const DEV_BOOTSTRAP_NAME = 'Local Dev User';

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepo: UsersRepository,
    private readonly otpCodesService: OtpCodesService,
    private readonly emailService: BrevoEmailService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly workspacesService: WorkspacesService,
  ) {
    const expiresIn = this.config.get<string>('jwt.expiresIn', '15m');
    this.jwtExpiresIn = this.parseExpiryToSeconds(expiresIn);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Register a new user.
   * - Stores the user with isEmailVerified=false
   * - Sends a 6-digit OTP via Brevo
   * - Returns a message (no tokens yet — login requires verification)
   */
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({ ...dto, passwordHash });
    await this.workspacesService.ensureDefaultWorkspaceForUser(
      user._id.toString(),
    );

    // Send verification email (fire-and-forget)
    await this.sendVerificationEmail(user);

    return {
      message:
        'Registration successful. Please check your email for the verification code.',
    };
  }

  /**
   * Login. Only verified users are granted tokens.
   */
  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please check your inbox for the verification code.',
      );
    }

    return this.issueTokens(user);
  }

  /**
   * Development-only helper to create or reuse a verified local user and
   * return a live session without going through email verification manually.
   */
  async devBootstrap(): Promise<AuthTokensDto> {
    const nodeEnv = this.config.get<string>(
      'app.nodeEnv',
      process.env.NODE_ENV ?? 'development',
    );

    if (nodeEnv !== 'development') {
      throw new NotFoundException('Not found');
    }

    let user = await this.usersService.findByEmail(DEV_BOOTSTRAP_EMAIL);

    if (!user) {
      const passwordHash = await bcrypt.hash(
        DEV_BOOTSTRAP_PASSWORD,
        BCRYPT_ROUNDS,
      );

      user = await this.usersService.create({
        email: DEV_BOOTSTRAP_EMAIL,
        password: DEV_BOOTSTRAP_PASSWORD,
        displayName: DEV_BOOTSTRAP_NAME,
        passwordHash,
      });
    }

    if (!user.isEmailVerified) {
      await this.usersService.markEmailVerified(user._id.toString());
      user = await this.usersService.findById(user._id.toString());
    }

    return this.issueTokens(user);
  }

  /**
   * Verify email with the OTP code.
   */
  async verifyEmail(params: {
    userId: string;
    code: string;
  }): Promise<{ message: string }> {
    // Validate (throws if invalid/expired)
    await this.otpCodesService.validate({
      userId: params.userId,
      rawCode: params.code,
      type: OtpType.EMAIL_VERIFY,
    });

    await this.usersService.markEmailVerified(params.userId);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  /**
   * Verify email with the OTP code using only email (pre-login flow).
   */
  async verifyEmailByEmail(params: {
    email: string;
    code: string;
  }): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(params.email);
    if (!user) {
      throw new BadRequestException('Invalid email or code');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified. You can log in.' };
    }

    return this.verifyEmail({ userId: user._id.toString(), code: params.code });
  }

  /**
   * Resend verification email. Rate-limited by OtpCodesService.
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    // Security: always return 200 to avoid user enumeration
    if (!user) {
      return { message: 'If that email exists, a new code has been sent.' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified.' };
    }

    await this.sendVerificationEmail(user);
    return { message: 'A new verification code has been sent to your email.' };
  }

  /**
   * Rotate refresh tokens. The JwtRefreshStrategy already validated the token.
   */
  async refresh(
    _userId: string,
    _refreshToken: string,
  ): Promise<AuthTokensDto> {
    const user = await this.usersService.findById(_userId);
    return this.issueTokens(user, {
      refreshToken: _refreshToken,
      persistRefreshToken: false,
    });
  }

  /**
   * Logout — clears the stored refresh token hash so the token is invalidated.
   */
  async logout(userId: string): Promise<void> {
    await this.usersRepo.clearRefreshToken(userId);
  }

  /**
   * Get the authenticated user's profile.
   */
  async getMe(userId: string): Promise<UserResponseDto> {
    await this.workspacesService.ensureDefaultWorkspaceForUser(userId);
    const user = await this.usersService.findById(userId);
    return this.toResponseDto(user);
  }

  /**
   * Update the authenticated user's profile.
   */
  async updateProfile(
    userId: string,
    update: { displayName?: string; avatarUrl?: string | null },
  ): Promise<void> {
    await this.usersService.updateProfile(userId, update);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async sendVerificationEmail(user: UserDocument): Promise<void> {
    const rawCode = await this.otpCodesService.generate({
      userId: user._id.toString(),
      type: OtpType.EMAIL_VERIFY,
    });

    await this.emailService.sendEmailVerification({
      to: { email: user.email, name: user.displayName },
      code: rawCode,
    });
  }

  private async issueTokens(
    user: UserDocument,
    options?: {
      refreshToken?: string;
      persistRefreshToken?: boolean;
    },
  ): Promise<AuthTokensDto> {
    await this.workspacesService.ensureDefaultWorkspaceForUser(
      user._id.toString(),
    );

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessSecret = this.config.get<string>(
      'jwt.secret',
      'fallback-secret',
    );
    const refreshSecret = this.config.get<string>(
      'jwt.refreshSecret',
      'fallback-refresh-secret',
    );
    const accessExpiry = this.config.get<string>('jwt.expiresIn', '15m');
    const refreshExpiry = this.config.get<string>('jwt.refreshExpiresIn', '7d');

    // Sign both tokens concurrently
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiry as never,
    });

    const shouldPersistRefreshToken = options?.persistRefreshToken !== false;
    const refreshToken =
      options?.refreshToken ??
      (await this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiry as never,
      }));

    if (shouldPersistRefreshToken) {
      // Store the initial refresh token hash at login; refresh reuses the same token.
      const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
      await this.usersRepo.updateRefreshTokenHash(
        user._id.toString(),
        refreshTokenHash,
      );
    }

    return { accessToken, refreshToken, expiresIn: this.jwtExpiresIn };
  }

  private toResponseDto(user: UserDocument): UserResponseDto {
    return new UserResponseDto({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      isEmailVerified: user.isEmailVerified,
      defaultWorkspaceId: user.defaultWorkspaceId?.toString() ?? null,
      activeWorkspaceId: user.activeWorkspaceId?.toString() ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(expiry);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * (multipliers[unit] ?? 1);
  }
}
