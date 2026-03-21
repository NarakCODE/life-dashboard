import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a controller or route as public (skips auth guards).
 * Usage: @Public() on a controller or route method.
 */
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Throttler guard that respects the @Public() decorator.
 * Extend this when you set up JWT/auth guards.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ConstructorParameters<typeof ThrottlerGuard>[0],
    storageService: ConstructorParameters<typeof ThrottlerGuard>[1],
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const reflector = new Reflector();
    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic ?? false;
  }
}
