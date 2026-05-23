import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ForgeOpsRequest } from '../types/request';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ForgeOpsRequest>();
    if (!req.user) return true; // JwtAuthGuard runs first; if user missing, let JwtAuthGuard fail

    // Try header first, then query param
    const slug =
      (req.headers['x-workspace-slug'] as string | undefined) ??
      (req.query.workspace as string | undefined);

    // Workspace slug is optional — some endpoints (e.g. GET /workspaces) don't need it
    if (!slug) return true;

    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });
    if (!workspace) throw new NotFoundException(`Workspace "${slug}" not found`);

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId: req.user.id, workspaceId: workspace.id },
      },
      select: { role: true },
    });
    if (!membership) throw new ForbiddenException('Not a member of this workspace');

    req.workspace = { id: workspace.id, slug: workspace.slug, role: membership.role };
    return true;
  }
}
