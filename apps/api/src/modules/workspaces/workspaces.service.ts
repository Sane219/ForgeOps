import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, EnvKind, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/request';

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
  description?: string;
}

export interface InviteMemberDto {
  email: string;
  role: Role;
}

export interface UpdateMemberRoleDto {
  role: Role;
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Workspace slug already taken');

    const workspace = await this.prisma.workspace.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        environments: {
          create: [
            { kind: EnvKind.DEV, name: 'Development' },
            { kind: EnvKind.STAGING, name: 'Staging' },
            { kind: EnvKind.PROD, name: 'Production', protected: true },
          ],
        },
        memberships: {
          create: { userId, role: Role.ADMIN },
        },
      },
      include: { environments: true, memberships: { where: { userId } } },
    });

    await this.prisma.auditEvent.create({
      data: {
        workspaceId: workspace.id,
        actorId: userId,
        action: AuditAction.WORKSPACE_CREATED,
        subjectKind: 'workspace',
        subjectId: workspace.id,
      },
    });

    return workspace;
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { workspace: { include: { _count: { select: { services: true, memberships: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      memberCount: m.workspace._count.memberships,
      serviceCount: m.workspace._count.services,
    }));
  }

  async getBySlug(userId: string, slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      include: {
        environments: true,
        memberships: { include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } } },
        _count: { select: { services: true } },
      },
    });
    if (!workspace) throw new NotFoundException(`Workspace "${slug}" not found`);

    const membership = workspace.memberships.find((m) => m.userId === userId);
    if (!membership) throw new ForbiddenException('Not a member of this workspace');

    return { ...workspace, role: membership.role };
  }

  async inviteMember(workspaceId: string, actorId: string, dto: InviteMemberDto) {
    const target = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!target) throw new NotFoundException(`User "${dto.email}" not found`);

    const existing = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: target.id, workspaceId } },
    });
    if (existing) throw new ConflictException('User is already a member');

    const membership = await this.prisma.membership.create({
      data: { userId: target.id, workspaceId, role: dto.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId,
        action: AuditAction.MEMBER_INVITED,
        subjectKind: 'user',
        subjectId: target.id,
        metadata: { role: dto.role },
      },
    });

    return membership;
  }

  async updateMemberRole(workspaceId: string, actorId: string, userId: string, dto: UpdateMemberRoleDto) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    // Cannot demote yourself if you're the last admin
    if (membership.role === Role.ADMIN && dto.role !== Role.ADMIN) {
      const adminCount = await this.prisma.membership.count({
        where: { workspaceId, role: Role.ADMIN },
      });
      if (adminCount <= 1) throw new ForbiddenException('Cannot remove the last admin');
    }

    const updated = await this.prisma.membership.update({
      where: { userId_workspaceId: { userId, workspaceId } },
      data: { role: dto.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId,
        action: AuditAction.MEMBER_ROLE_CHANGED,
        subjectKind: 'user',
        subjectId: userId,
        metadata: { oldRole: membership.role, newRole: dto.role },
      },
    });

    return updated;
  }

  async removeMember(workspaceId: string, actorId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    if (userId === actorId) throw new ForbiddenException('Cannot remove yourself');

    await this.prisma.membership.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    await this.prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId,
        action: AuditAction.MEMBER_REMOVED,
        subjectKind: 'user',
        subjectId: userId,
      },
    });

    return { message: 'Member removed' };
  }
}
