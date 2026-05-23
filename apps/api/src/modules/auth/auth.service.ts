import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, EnvKind, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from './jwt.strategy';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  memberships: Array<{
    workspaceId: string;
    workspaceSlug: string;
    workspaceName: string;
    role: Role;
  }>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: AuthUser; tokens: TokenPair }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Default workspace from email prefix, sanitized
    const slug = (dto.email.split('@')[0] ?? 'user').replace(/[^a-z0-9-]/g, '-').toLowerCase();
    const workspaceName = `${dto.name}'s Workspace`;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        memberships: {
          create: {
            role: Role.ADMIN,
            workspace: {
              create: {
                slug,
                name: workspaceName,
                environments: {
                  create: [
                    { kind: EnvKind.DEV, name: 'Development' },
                    { kind: EnvKind.STAGING, name: 'Staging' },
                    { kind: EnvKind.PROD, name: 'Production', protected: true },
                  ],
                },
              },
            },
          },
        },
      },
      include: {
        memberships: { include: { workspace: true } },
      },
    });

    const tokens = await this.issueTokens({ sub: user.id, email: user.email, name: user.name });

    if (user.memberships[0]) {
      await this.prisma.auditEvent.create({
        data: {
          workspaceId: user.memberships[0].workspaceId,
          actorId: user.id,
          action: AuditAction.WORKSPACE_CREATED,
          subjectKind: 'workspace',
          subjectId: user.memberships[0].workspaceId,
        },
      });
    }

    return {
      user: this.formatUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: { include: { workspace: true } } },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens({ sub: user.id, email: user.email, name: user.name });

    if (user.memberships[0]) {
      await this.prisma.auditEvent.create({
        data: {
          workspaceId: user.memberships[0].workspaceId,
          actorId: user.id,
          action: AuditAction.USER_LOGGED_IN,
          subjectKind: 'user',
          subjectId: user.id,
        },
      });
    }

    return {
      user: this.formatUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<{ user: AuthUser; tokens: TokenPair }> {
    try {
      const payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { memberships: { include: { workspace: true } } },
      });
      if (!user) throw new UnauthorizedException();

      const tokens = await this.issueTokens({ sub: user.id, email: user.email, name: user.name });
      return { user: this.formatUser(user), tokens };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { include: { workspace: true } } },
    });
    if (!user) throw new UnauthorizedException();
    return this.formatUser(user);
  }

  private async issueTokens(payload: JwtPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshTtl', '30d'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private formatUser(user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    memberships: Array<{
      workspaceId: string;
      role: Role;
      workspace: { id: string; slug: string; name: string };
    }>;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      memberships: user.memberships.map((m) => ({
        workspaceId: m.workspaceId,
        workspaceSlug: m.workspace.slug,
        workspaceName: m.workspace.name,
        role: m.role,
      })),
    };
  }
}
