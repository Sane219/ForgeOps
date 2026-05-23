import { Injectable, Logger } from '@nestjs/common';
import { RolloutStatus } from '@prisma/client';
import type {
  FailureScenario,
  RolloutDriver,
  RolloutObservation,
  RolloutPlan,
} from './rollout-driver.interface';

/**
 * Deterministic mock rollout driver.
 *
 * start() returns IN_PROGRESS immediately — the actual state machine
 * progression (pulling_image → starting_container → health_check → ready)
 * is driven by the BullMQ RolloutProcessor.
 *
 * This driver simply validates the plan and returns the initial observation.
 * A real KubernetesRolloutDriver would call the K8s API here.
 */
@Injectable()
export class MockRolloutDriver implements RolloutDriver {
  private readonly logger = new Logger(MockRolloutDriver.name);

  async start(plan: RolloutPlan): Promise<RolloutObservation> {
    this.logger.log(
      `[mock] start rolloutId=${plan.rolloutId} image=${plan.imageTag} scenario=${plan.failureScenario}`,
    );
    return {
      rolloutId: plan.rolloutId,
      status: RolloutStatus.IN_PROGRESS,
      phase: 'pulling_image',
      message: `Pulling image ${plan.imageTag}`,
    };
  }

  async rollback(rolloutId: string): Promise<RolloutObservation> {
    this.logger.log(`[mock] rollback rolloutId=${rolloutId}`);
    return {
      rolloutId,
      status: RolloutStatus.IN_PROGRESS,
      phase: 'rolling_back',
      message: 'Initiating rollback to previous stable version',
    };
  }

  async observe(rolloutId: string): Promise<RolloutObservation> {
    // In mock mode, observation is handled by the BullMQ worker directly
    return {
      rolloutId,
      status: RolloutStatus.IN_PROGRESS,
    };
  }
}
