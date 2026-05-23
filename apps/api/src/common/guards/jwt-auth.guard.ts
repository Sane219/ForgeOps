import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { ForgeOpsRequest, AuthenticatedUser } from '../types/request';
import type { JwtPayload } from '../../modules/auth/jwt.strategy';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<ForgeOpsRequest>();
    const token = (req.cookies?.['forgeops_access_token'] as string) ?? null;
    if (!token) throw new UnauthorizedException('Not authenticated');

    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('jwt.accessSecret') ?? '',
      });
      req.user = { id: payload.sub, email: payload.email, name: payload.name ?? null };
      return true;
    } catch {
      // Try silent refresh from refresh cookie
      const refreshToken = (req.cookies?.['forgeops_refresh_token'] as string) ?? null;
      if (!refreshToken) throw new UnauthorizedException('Token expired');

      try {
        const refreshPayload = this.jwt.verify<JwtPayload>(refreshToken, {
          secret: this.config.get<string>('jwt.refreshSecret') ?? '',
        });
        // Attach user but don't auto-rotate here — the /auth/refresh endpoint handles that
        req.user = { id: refreshPayload.sub, email: refreshPayload.email, name: refreshPayload.name ?? null };
        return true;
      } catch {
        throw new UnauthorizedException('Session expired');
      }
    }
  }
}
