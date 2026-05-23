import { Module } from '@nestjs/common';

/**
 * Day-4 deliverable. BullMQ setup + workers:
 *   - RolloutWorker  — drives the mock rollout state machine
 *   - ScanWorker     — produces SecurityReports for completed rollouts
 *   - AiWorker       — pre-warms deterministic analyses on rollout failure
 *
 * Bull Board mounted at /queues in dev only.
 */
@Module({})
export class QueuesModule {}
