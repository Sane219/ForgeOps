import type { RolloutStatus } from '@prisma/client';

export interface RolloutPlan {
  rolloutId: string;
  deploymentId: string;
  serviceVersionId: string;
  imageTag: string;
}

export interface RolloutObservation {
  rolloutId: string;
  status: RolloutStatus;
  message?: string;
  failureReason?: string;
}

/**
 * Port for executing a deployment rollout.
 *
 * MVP ships with [[MockRolloutDriver]]. A future KubernetesRolloutDriver
 * can be swapped in via PROVIDER_ROLLOUT=kubernetes without touching the
 * deployments domain.
 */
export const ROLLOUT_DRIVER = Symbol('ROLLOUT_DRIVER');

export interface RolloutDriver {
  start(plan: RolloutPlan): Promise<RolloutObservation>;
  rollback(rolloutId: string): Promise<RolloutObservation>;
  observe(rolloutId: string): Promise<RolloutObservation>;
}
