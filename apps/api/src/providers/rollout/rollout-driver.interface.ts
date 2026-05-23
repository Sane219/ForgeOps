import type { RolloutStatus } from '@prisma/client';

export type FailureScenario =
  | 'none'                  // deterministic success
  | 'OOMKilled'             // container exceeded memory limit
  | 'ImagePullBackOff'      // image tag not found in registry
  | 'ReadinessProbeTimeout' // health check never passed
  | 'CrashLoopBackOff';     // container keeps restarting

export interface RolloutPlan {
  rolloutId: string;
  deploymentId: string;
  serviceVersionId: string;
  imageTag: string;
  failureScenario: FailureScenario;
}

export interface RolloutObservation {
  rolloutId: string;
  status: RolloutStatus;
  phase?: string;
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
