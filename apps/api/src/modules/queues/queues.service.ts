import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type { RolloutPlan } from '../../providers/rollout/rollout-driver.interface';

@Injectable()
export class QueuesService implements OnModuleDestroy {
  private readonly logger = new Logger(QueuesService.name);
  private rolloutQueue: Queue;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('redis.url') ?? 'redis://localhost:6379';
    this.rolloutQueue = new Queue('rollout', {
      connection: { url: redisUrl },
    });
    this.logger.log(`Connected to BullMQ queue at ${redisUrl}`);
  }

  async enqueueRollout(plan: RolloutPlan): Promise<string> {
    const job = await this.rolloutQueue.add('execute-rollout', plan, {
      attempts: 1,
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    });
    this.logger.log(`Enqueued rollout job ${job.id} for rollout ${plan.rolloutId}`);
    return job.id ?? 'unknown';
  }

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.rolloutQueue.getWaitingCount(),
      this.rolloutQueue.getActiveCount(),
      this.rolloutQueue.getCompletedCount(),
      this.rolloutQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }

  async onModuleDestroy(): Promise<void> {
    await this.rolloutQueue.close();
  }
}
