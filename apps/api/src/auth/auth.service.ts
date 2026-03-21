import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokensDto, JwtPayload } from './dto/auth-tokens.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserResponseDto } from '../users/dto/user-response.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    const expiresIn = this.config.get<string>('jwt.expiresIn', '15m');
    this.jwtExpiresIn = this.parseExpiryToSeconds(expiresIn);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({ ...dto, passwordHash });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(
    _userId: string,
    _refreshToken: string,
  ): Promise<AuthTokensDto> {
    // JwtRefreshStrategy already validated the token against the stored hash.
    // Re-fetch the user and issue a fresh token pair (rotation).
    const user = await this.usersService.findById(_userId);
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersRepo.clearRefreshToken(userId);
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    return this.toResponseDto(user);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async issueTokens(user: UserDocument): Promise<AuthTokensDto> {
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
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiry as never,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiry as never,
      }),
    ]);

    // Hash and store the new refresh token (rotation pattern)
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersRepo.updateRefreshTokenHash(
      user._id.toString(),
      refreshTokenHash,
    );

    return { accessToken, refreshToken, expiresIn: this.jwtExpiresIn };
  }

  private toResponseDto(user: UserDocument): UserResponseDto {
    return new UserResponseDto({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
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
