import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../dto/auth-tokens.dto';

/**
 * WebSocket User Decorator
 * 
 * Extracts the authenticated user from the WebSocket client.
 * Must be used with WsJwtGuard.
 * 
 * @example
 * ```typescript
 * @SubscribeMessage('event')
 * handleEvent(@WsUser() user: JwtPayload, client: Socket) {
 *   console.log(user.sub); // user ID
 * }
 * ```
 */
export const WsUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | JwtPayload[keyof JwtPayload] | null => {
    const client = ctx.switchToWs().getClient();
    const user = client.user as JwtPayload | undefined;

    if (!user) {
      return null;
    }

    return data ? user[data] ?? null : user;
  },
);
