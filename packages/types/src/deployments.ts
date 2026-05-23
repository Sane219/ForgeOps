import { z } from 'zod';
import { EnvKind, HealthStatus, RolloutStatus } from './enums';

export const envKindEnum = z.enum([EnvKind.DEV, EnvKind.STAGING, EnvKind.PROD]);

export const triggerRolloutSchema = z.object({
  environmentKind: envKindEnum,
  serviceVersionId: z.string().min(1),
  imageTag: z.string().min(1).max(200).optional(),
});
export type TriggerRolloutInput = z.infer<typeof triggerRolloutSchema>;

export const rollbackSchema = z.object({
  targetRolloutId: z.string().min(1),
});
export type RollbackInput = z.infer<typeof rollbackSchema>;

export interface DeploymentSummary {
  id: string;
  serviceId: string;
  environmentKind: EnvKind;
  health: HealthStatus;
  restartCount: number;
  currentRolloutStatus: RolloutStatus | null;
  currentImageTag: string | null;
  lastUpdatedAt: string;
}

export interface RolloutSummary {
  id: string;
  deploymentId: string;
  serviceVersionId: string;
  status: RolloutStatus;
  imageTag: string;
  failureReason: string | null;
  triggeredById: string | null;
  startedAt: string;
  finishedAt: string | null;
}
