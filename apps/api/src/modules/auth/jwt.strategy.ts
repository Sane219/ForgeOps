import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../../common/types/request';

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => (req?.cookies?.['forgeops_access_token'] as string) ?? null,
      ]),
      secretOrKey: config.get<string>('jwt.accessSecret'),
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub) throw new UnauthorizedException();
    return { id: payload.sub, email: payload.email, name: payload.name ?? null } satisfies AuthenticatedUser;
  }
}
