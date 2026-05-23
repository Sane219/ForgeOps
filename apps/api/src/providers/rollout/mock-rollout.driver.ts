import { Injectable, Logger } from '@nestjs/common';
import { RolloutStatus } from '@prisma/client';
import type {
  RolloutDriver,
  RolloutObservation,
  RolloutPlan,
} from './rollout-driver.interface';

/**
 * Day-4 deliverable: enqueues a BullMQ job that drives a realistic rollout
 * state machine (PENDING → IN_PROGRESS → SUCCEEDED|FAILED) with timed
 * transitions and ~10–15% mocked failures with K8s-style reasons:
 *   ImagePullBackOff, OOMKilled, readiness-probe-timeout, CrashLoopBackOff.
 *
 * Day-1 skeleton: returns PENDING immediately and logs the request.
 */
@Injectable()
export class MockRolloutDriver implements RolloutDriver {
  private readonly logger = new Logger(MockRolloutDriver.name);

  async start(plan: RolloutPlan): Promise<RolloutObservation> {
    this.logger.log(
      `[mock] start rolloutId=${plan.rolloutId} version=${plan.serviceVersionId} image=${plan.imageTag}`,
    );
    return { rolloutId: plan.rolloutId, status: RolloutStatus.PENDING };
  }

  async rollback(rolloutId: string): Promise<RolloutObservation> {
    this.logger.log(`[mock] rollback rolloutId=${rolloutId}`);
    return { rolloutId, status: RolloutStatus.ROLLED_BACK };
  }

  async observe(rolloutId: string): Promise<RolloutObservation> {
    return { rolloutId, status: RolloutStatus.PENDING };
  }
}
