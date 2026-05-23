import { Module } from '@nestjs/common';

/**
 * Day-4 deliverable. Deployment + Rollout state machine. `triggerRollout()`
 * resolves the target ServiceVersion's artifacts, calls the configured
 * [[rollout-driver]] (mock by default), and reflects status transitions
 * back into the Deployment + Rollout rows.
 */
@Module({})
export class DeploymentsModule {}
