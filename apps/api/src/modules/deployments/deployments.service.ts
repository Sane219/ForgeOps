import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, EnvKind, RolloutStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { QueuesService } from '../queues/queues.service';
import type { FailureScenario, RolloutPlan } from '../../providers/rollout/rollout-driver.interface';
import type { TriggerRolloutDto } from './dto/trigger-rollout.dto';

/* eslint-disable @typescript-eslint/no-explicit-any */

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly queues: QueuesService,
  ) {}

  async listForWorkspace(workspaceId: string) {
    return this.prisma.deployment.findMany({
      where: { service: { workspaceId } },
      include: {
        service: { select: { id: true, name: true, slug: true, runtime: true } },
        environment: { select: { id: true, kind: true, name: true, protected: true } },
        currentRollout: {
          select: { id: true, status: true, imageTag: true, startedAt: true, finishedAt: true, failureReason: true },
        },
      },
      orderBy: { lastUpdatedAt: 'desc' },
    });
  }

  async listForService(workspaceId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      select: { id: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.deployment.findMany({
      where: { serviceId },
      include: {
        environment: { select: { id: true, kind: true, name: true, protected: true } },
        currentRollout: {
          select: { id: true, status: true, imageTag: true, startedAt: true, finishedAt: true, failureReason: true },
        },
        _count: { select: { rollouts: true } },
      },
      orderBy: { environment: { kind: 'asc' } },
    });
  }

  async triggerRollout(userId: string, workspaceId: string, serviceId: string, dto: TriggerRolloutDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      include: { versions: { orderBy: { version: 'desc' as const }, take: 1 } },
    });
    if (!service) throw new NotFoundException('Service not found');
    if (!service.versions[0]) throw new NotFoundException('Service has no versions');

    const version = service.versions[0];

    const artifactCount = await this.prisma.artifact.count({
      where: { serviceVersionId: version.id },
    });
    if (artifactCount === 0) throw new ConflictException('Generate artifacts before deploying');

    const environment = await this.prisma.environment.findUnique({
      where: { workspaceId_kind: { workspaceId, kind: dto.environment } },
    });
    if (!environment) throw new NotFoundException(`Environment ${dto.environment} not found`);

    const deployment = await this.prisma.deployment.upsert({
      where: { serviceId_environmentId: { serviceId, environmentId: environment.id } },
      create: { serviceId, environmentId: environment.id },
      update: {},
    });

    const activeRollout = await this.prisma.rollout.findFirst({
      where: {
        deploymentId: deployment.id,
        status: { in: [RolloutStatus.PENDING, RolloutStatus.IN_PROGRESS] },
      },
    });
    if (activeRollout) throw new ConflictException('A rollout is already in progress for this deployment');

    const failureScenario = this.determineFailureScenario(service.runtime, dto.environment);

    const rollout = await this.prisma.rollout.create({
      data: {
        deploymentId: deployment.id,
        serviceVersionId: version.id,
        status: RolloutStatus.PENDING,
        imageTag: version.image ?? `ghcr.io/${service.slug}:v${version.version}`,
        triggeredById: userId,
      },
    });

    const plan: RolloutPlan = {
      rolloutId: rollout.id,
      deploymentId: deployment.id,
      serviceVersionId: version.id,
      imageTag: rollout.imageTag,
      failureScenario,
    };
    await this.queues.enqueueRollout(plan);

    await this.audit.record({
      workspaceId,
      actorId: userId,
      action: AuditAction.DEPLOYMENT_TRIGGERED,
      subjectKind: 'rollout',
      subjectId: rollout.id,
      metadata: { serviceId, environment: dto.environment, version: version.version, imageTag: rollout.imageTag, failureScenario } as any,
    });

    this.logger.log(`Rollout ${rollout.id} triggered for ${service.slug} → ${dto.environment}`);
    return rollout;
  }

  async listRollouts(workspaceId: string, deploymentId: string) {
    const deployment = await this.prisma.deployment.findFirst({
      where: { id: deploymentId, service: { workspaceId } },
      select: { id: true },
    });
    if (!deployment) throw new NotFoundException('Deployment not found');

    return this.prisma.rollout.findMany({
      where: { deploymentId },
      include: {
        serviceVersion: { select: { id: true, version: true, image: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async rollback(userId: string, workspaceId: string, deploymentId: string) {
    const deployment = await this.prisma.deployment.findFirst({
      where: { id: deploymentId, service: { workspaceId } },
      include: {
        service: { select: { id: true, slug: true } },
        environment: { select: { id: true, kind: true, protected: true } },
      },
    });
    if (!deployment) throw new NotFoundException('Deployment not found');

    const lastSucceeded = await this.prisma.rollout.findFirst({
      where: { deploymentId, status: RolloutStatus.SUCCEEDED },
      orderBy: { startedAt: 'desc' },
    });
    if (!lastSucceeded) throw new ConflictException('No succeeded rollout to rollback to');

    const activeRollout = await this.prisma.rollout.findFirst({
      where: { deploymentId, status: { in: [RolloutStatus.PENDING, RolloutStatus.IN_PROGRESS] } },
    });
    if (activeRollout) throw new ConflictException('A rollout is already in progress');

    const rollout = await this.prisma.rollout.create({
      data: {
        deploymentId,
        serviceVersionId: lastSucceeded.serviceVersionId,
        status: RolloutStatus.PENDING,
        imageTag: lastSucceeded.imageTag,
        triggeredById: userId,
      },
    });

    const plan: RolloutPlan = {
      rolloutId: rollout.id,
      deploymentId,
      serviceVersionId: lastSucceeded.serviceVersionId,
      imageTag: lastSucceeded.imageTag,
      failureScenario: 'none',
    };
    await this.queues.enqueueRollout(plan);

    await this.audit.record({
      workspaceId,
      actorId: userId,
      action: AuditAction.ROLLBACK_REQUESTED,
      subjectKind: 'rollout',
      subjectId: rollout.id,
      metadata: { deploymentId, rollbackToVersion: lastSucceeded.serviceVersionId } as any,
    });

    this.logger.log(`Rollback ${rollout.id} triggered for deployment ${deploymentId}`);
    return rollout;
  }

  private determineFailureScenario(runtime: string, environment: EnvKind): FailureScenario {
    if (environment === EnvKind.DEV) return 'none';

    const hash = this.simpleHash(runtime);
    const threshold = environment === EnvKind.PROD ? 15 : 10;
    if (hash % 100 < threshold) {
      const scenarios: FailureScenario[] = ['OOMKilled', 'ImagePullBackOff', 'ReadinessProbeTimeout', 'CrashLoopBackOff'];
      return (scenarios[hash % scenarios.length] ?? 'OOMKilled') as FailureScenario;
    }

    return 'none' as FailureScenario;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
