import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma, Runtime } from '@prisma/client';
import { getTemplate } from '@forgeops/templates';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateServiceDto } from './dto/create-service.dto';
import type { UpdateServiceDto } from './dto/update-service.dto';

/* eslint-disable @typescript-eslint/no-explicit-any */

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, workspaceId: string, dto: CreateServiceDto) {
    const template = getTemplate(dto.templateKey);
    if (!template) throw new NotFoundException(`Template "${dto.templateKey}" not found`);

    const existing = await this.prisma.service.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: dto.slug } },
    });
    if (existing) throw new ConflictException(`Service slug "${dto.slug}" already exists`);

    // Look up the ServiceTemplate by key to get its ID
    const dbTemplate = await this.prisma.serviceTemplate.findUnique({
      where: { key: dto.templateKey },
      select: { id: true },
    });
    if (!dbTemplate) throw new NotFoundException(`Template "${dto.templateKey}" not found in database`);

    const service = await this.prisma.service.create({
      data: {
        workspaceId,
        templateId: dbTemplate.id,
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        runtime: template.runtime as Runtime,
        repoUrl: dto.repoUrl ?? null,
        ownerId: userId,
        tags: (dto.tags ?? []) as any,
        versions: {
          create: {
            version: 1,
            replicas: 2,
            cpuMillicores: 500,
            memoryMb: 512,
            port: template.defaultPort,
            healthcheckPath: template.defaultHealthcheckPath,
            envVars: (template.defaultEnvVars ?? []) as any,
            image: `ghcr.io/${dto.slug}:v1`,
            notes: 'Initial version created from template',
            createdById: userId,
          },
        },
      },
      include: {
        versions: { orderBy: { version: 'desc' as const }, take: 1 },
      },
    });

    await this.audit.record({
      workspaceId,
      actorId: userId,
      action: AuditAction.SERVICE_CREATED,
      subjectKind: 'service',
      subjectId: service.id,
      metadata: { name: dto.name, slug: dto.slug, templateKey: dto.templateKey } as any,
    });

    this.logger.log(`Service ${dto.slug} created in workspace ${workspaceId}`);
    return this.formatServiceDetail(service as any);
  }

  async list(workspaceId: string) {
    const services = await this.prisma.service.findMany({
      where: { workspaceId },
      include: {
        versions: { orderBy: { version: 'desc' as const }, take: 1 },
        _count: { select: { deployments: true, versions: true } },
      },
      orderBy: { createdAt: 'desc' as const },
    });
    return services.map((s) => this.formatServiceSummary(s as any));
  }

  async getById(workspaceId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      include: {
        versions: { orderBy: { version: 'desc' as const }, take: 1 },
        _count: { select: { deployments: true, versions: true } },
      },
    });
    if (!service) throw new NotFoundException('Service not found');

    const latestVersion = service.versions[0];
    let artifacts: any[] = [];
    if (latestVersion) {
      artifacts = await this.prisma.artifact.findMany({
        where: { serviceVersionId: latestVersion.id },
        orderBy: { kind: 'asc' as const },
      });
    }

    return {
      ...this.formatServiceDetail(service as any),
      latestArtifacts: artifacts,
    };
  }

  async update(userId: string, workspaceId: string, serviceId: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.repoUrl !== undefined && { repoUrl: dto.repoUrl }),
        ...(dto.tags !== undefined && { tags: dto.tags as any }),
      },
      include: {
        versions: { orderBy: { version: 'desc' as const }, take: 1 },
        _count: { select: { deployments: true, versions: true } },
      },
    });

    await this.audit.record({
      workspaceId,
      actorId: userId,
      action: AuditAction.SERVICE_UPDATED,
      subjectKind: 'service',
      subjectId: serviceId,
      metadata: { changes: dto } as any,
    });

    return this.formatServiceDetail(updated as any);
  }

  async listVersions(workspaceId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      select: { id: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.serviceVersion.findMany({
      where: { serviceId },
      orderBy: { version: 'desc' as const },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
        _count: { select: { artifacts: true } },
      },
    });
  }

  async getLatestArtifacts(workspaceId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      include: { versions: { orderBy: { version: 'desc' as const }, take: 1 } },
    });
    if (!service) throw new NotFoundException('Service not found');

    const latestVersion = service.versions[0];
    if (!latestVersion) return { serviceVersionId: null, version: 0, artifacts: [] };

    const artifacts = await this.prisma.artifact.findMany({
      where: { serviceVersionId: latestVersion.id },
      orderBy: { kind: 'asc' as const },
    });

    return {
      serviceVersionId: latestVersion.id,
      version: latestVersion.version,
      image: latestVersion.image,
      artifacts,
    };
  }

  async getServiceForGeneration(workspaceId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      include: {
        workspace: { select: { id: true, slug: true, name: true } },
        versions: { orderBy: { version: 'desc' as const }, take: 1 },
      },
    });
    if (!service) throw new NotFoundException('Service not found');
    if (!service.versions[0]) throw new NotFoundException('Service has no versions');
    return service;
  }

  // ── Formatters ─────────────────────────────────────────────
  private formatServiceSummary(service: any) {
    return {
      id: service.id,
      workspaceId: service.workspaceId,
      name: service.name,
      slug: service.slug,
      description: service.description,
      runtime: service.runtime,
      repoUrl: service.repoUrl,
      ownerId: service.ownerId,
      tags: Array.isArray(service.tags) ? service.tags : [],
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
      latestVersion: service.versions?.[0]?.version ?? 0,
      deploymentCount: service._count?.deployments ?? 0,
      versionCount: service._count?.versions ?? 0,
    };
  }

  private formatServiceDetail(service: any) {
    const v = service.versions?.[0];
    return {
      id: service.id,
      workspaceId: service.workspaceId,
      name: service.name,
      slug: service.slug,
      description: service.description,
      runtime: service.runtime,
      repoUrl: service.repoUrl,
      ownerId: service.ownerId,
      tags: Array.isArray(service.tags) ? service.tags : [],
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
      latestVersion: v
        ? {
            id: v.id,
            version: v.version,
            image: v.image,
            replicas: v.replicas,
            cpuMillicores: v.cpuMillicores,
            memoryMb: v.memoryMb,
            port: v.port,
            healthcheckPath: v.healthcheckPath,
            notes: v.notes,
            createdAt: v.createdAt.toISOString(),
          }
        : null,
      deploymentCount: service._count?.deployments ?? 0,
      versionCount: service._count?.versions ?? 0,
    };
  }
}
