import { Injectable } from '@nestjs/common';
import { type AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface RecordAuditDto {
  workspaceId: string;
  actorId?: string;
  action: AuditAction;
  subjectKind?: string;
  subjectId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(dto: RecordAuditDto) {
    return this.prisma.auditEvent.create({ data: dto });
  }

  async listForWorkspace(workspaceId: string, opts?: { limit?: number; offset?: number }) {
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;
    const [items, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditEvent.count({ where: { workspaceId } }),
    ]);
    return { items, total, limit, offset };
  }
}
