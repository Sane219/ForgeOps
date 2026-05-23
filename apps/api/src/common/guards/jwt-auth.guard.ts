import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Day-2 deliverable. Verifies the `forgeops_access_token` httpOnly cookie,
 * attaches `req.user`, and silently rotates the access token from a valid
 * refresh cookie when expired.
 *
 * Day-1 skeleton lets requests through so the API boots cleanly without
 * auth wired up.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    // TODO(day-2): verify JWT, attach req.user
    return true;
  }
}
