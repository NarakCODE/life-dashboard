import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Socket } from 'socket.io';
import { JwtPayload } from '../dto/auth-tokens.dto';

/**
 * WebSocket JWT Authentication Guard
 *
 * Validates JWT token from WebSocket connection handshake auth.
 * Token can be provided via:
 * - handshake.auth.token
 * - handshake.query.token
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn('No JWT token found in WebSocket handshake');
        throw new UnauthorizedException('Authentication token required');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret', 'fallback-secret'),
      });

      // Attach user to socket for later use
      (client as any).user = payload;

      return true;
    } catch (error) {
      this.logger.error(
        `WebSocket authentication failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractToken(client: Socket): string | null {
    // Try auth object first (recommended)
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return this.cleanToken(authToken);
    }

    // Fallback to query params
    const queryToken = client.handshake.query?.token;
    if (queryToken) {
      const token = Array.isArray(queryToken) ? queryToken[0] : queryToken;
      if (token) {
        return this.cleanToken(token);
      }
    }

    // Try headers
    const headerToken = client.handshake.headers?.authorization;
    if (headerToken) {
      const token = Array.isArray(headerToken) ? headerToken[0] : headerToken;
      if (token) {
        return this.cleanToken(token);
      }
    }

    return null;
  }

  private cleanToken(token: string): string {
    // Remove Bearer prefix if present
    return token.replace(/^Bearer\s+/i, '');
  }
}
