import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersRepository } from '../../users/users.repository';
import { JwtPayload, JwtRefreshPayload } from '../dto/auth-tokens.dto';
import * as bcrypt from 'bcrypt';

/**
 * Refresh token strategy.
 * Extracts the refresh JWT from the Authorization header (Bearer),
 * compares it against the bcrypt hash stored in the User document.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly usersRepo: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'jwt.refreshSecret',
        'fallback-refresh-secret',
      ),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<JwtRefreshPayload> {
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader?.split(' ')[1];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const user = await this.usersRepo.findById(payload.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    return { sub: payload.sub, email: payload.email, refreshToken };
  }
}
