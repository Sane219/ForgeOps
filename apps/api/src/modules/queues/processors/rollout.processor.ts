import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { RolloutStatus, HealthStatus, AuditAction } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import type { RolloutPlan, FailureScenario } from '../../../providers/rollout/rollout-driver.interface';

export interface RolloutJobData extends RolloutPlan {}

interface RolloutPhase {
  name: string;
  durationMs: number;
  failOnScenario?: FailureScenario;
  failMessage?: string;
}

const ROLLOUT_PHASES: RolloutPhase[] = [
  {
    name: 'pulling_image',
    durationMs: 1500,
    failOnScenario: 'ImagePullBackOff',
    failMessage: 'Failed to pull image: manifest unknown',
  },
  {
    name: 'starting_container',
    durationMs: 2000,
    failOnScenario: 'OOMKilled',
    failMessage: 'Container killed due to memory limit exceeded',
  },
  {
    name: 'running_health_check',
    durationMs: 2500,
    failOnScenario: 'ReadinessProbeTimeout',
    failMessage: 'Readiness probe timed out after 30s',
  },
  {
    name: 'ready',
    durationMs: 1000,
    failOnScenario: 'CrashLoopBackOff',
    failMessage: 'Container crashed during startup',
  },
];

@Injectable()
export class RolloutProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(RolloutProcessor.name);
  private worker: Worker | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  start(): void {
    const redisUrl = this.config.get<string>('redis.url') ?? 'redis://localhost:6379';

    this.worker = new Worker('rollout', (job) => this.process(job), {
      connection: { url: redisUrl },
      concurrency: 3,
    });

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('Rollout processor started');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }

  private async process(job: Job<RolloutJobData>): Promise<void> {
    const plan = job.data;
    this.logger.log(`Processing rollout ${plan.rolloutId} (scenario: ${plan.failureScenario})`);

    // Update rollout to IN_PROGRESS
    await this.prisma.rollout.update({
      where: { id: plan.rolloutId },
      data: { status: RolloutStatus.IN_PROGRESS },
    });

    // Execute phases
    for (const phase of ROLLOUT_PHASES) {
      await job.updateProgress({ phase: phase.name });

      // Simulate work
      await this.sleep(phase.durationMs);

      // Check if this phase should fail
      if (phase.failOnScenario && plan.failureScenario === phase.failOnScenario) {
        this.logger.warn(`Rollout ${plan.rolloutId} failed at ${phase.name}: ${phase.failMessage}`);

        await this.prisma.rollout.update({
          where: { id: plan.rolloutId },
          data: {
            status: RolloutStatus.FAILED,
            failureReason: phase.failMessage,
            finishedAt: new Date(),
          },
        });

        await this.prisma.deployment.update({
          where: { id: plan.deploymentId },
          data: { health: HealthStatus.UNHEALTHY, lastUpdatedAt: new Date() },
        });

        await this.audit.record({
          workspaceId: await this.getWorkspaceId(plan.deploymentId),
          action: AuditAction.ROLLOUT_FAILED,
          subjectKind: 'rollout',
          subjectId: plan.rolloutId,
          metadata: { reason: phase.failMessage, phase: phase.name, scenario: plan.failureScenario } as any,
        });

        return;
      }
    }

    // All phases passed — success
    this.logger.log(`Rollout ${plan.rolloutId} succeeded`);

    await this.prisma.rollout.update({
      where: { id: plan.rolloutId },
      data: {
        status: RolloutStatus.SUCCEEDED,
        finishedAt: new Date(),
      },
    });

    await this.prisma.deployment.update({
      where: { id: plan.deploymentId },
      data: {
        health: HealthStatus.HEALTHY,
        currentRolloutId: plan.rolloutId,
        lastUpdatedAt: new Date(),
      },
    });

    await this.audit.record({
      workspaceId: await this.getWorkspaceId(plan.deploymentId),
      action: AuditAction.ROLLOUT_SUCCEEDED,
      subjectKind: 'rollout',
      subjectId: plan.rolloutId,
      metadata: { imageTag: plan.imageTag } as any,
    });
  }

  private async getWorkspaceId(deploymentId: string): Promise<string> {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { service: { select: { workspaceId: true } } },
    });
    return deployment?.service.workspaceId ?? '';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
