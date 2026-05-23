// Mirrored from prisma/schema.prisma — keep in sync.
// Using `as const` objects gives both literal-type narrowing and runtime values.

export const Role = {
  ADMIN: 'ADMIN',
  DEVELOPER: 'DEVELOPER',
  VIEWER: 'VIEWER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Runtime = {
  NEXTJS: 'NEXTJS',
  NESTJS: 'NESTJS',
  FASTAPI: 'FASTAPI',
  PYTHON_WORKER: 'PYTHON_WORKER',
  GO_SERVICE: 'GO_SERVICE',
  STATIC: 'STATIC',
} as const;
export type Runtime = (typeof Runtime)[keyof typeof Runtime];

export const EnvKind = {
  DEV: 'DEV',
  STAGING: 'STAGING',
  PROD: 'PROD',
} as const;
export type EnvKind = (typeof EnvKind)[keyof typeof EnvKind];

export const RolloutStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK',
} as const;
export type RolloutStatus = (typeof RolloutStatus)[keyof typeof RolloutStatus];

export const HealthStatus = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  UNKNOWN: 'UNKNOWN',
} as const;
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export const Severity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const FindingKind = {
  CONTAINER: 'CONTAINER',
  SECRET: 'SECRET',
  DEPENDENCY: 'DEPENDENCY',
  LINT: 'LINT',
  POLICY: 'POLICY',
} as const;
export type FindingKind = (typeof FindingKind)[keyof typeof FindingKind];

export const ArtifactKind = {
  DOCKERFILE: 'DOCKERFILE',
  K8S_MANIFEST: 'K8S_MANIFEST',
  HELM_VALUES: 'HELM_VALUES',
  CI_PIPELINE: 'CI_PIPELINE',
  ARGO_APP: 'ARGO_APP',
} as const;
export type ArtifactKind = (typeof ArtifactKind)[keyof typeof ArtifactKind];

export const IncidentStatus = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED',
} as const;
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus];

export const AuditAction = {
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  WORKSPACE_CREATED: 'WORKSPACE_CREATED',
  MEMBER_INVITED: 'MEMBER_INVITED',
  MEMBER_ROLE_CHANGED: 'MEMBER_ROLE_CHANGED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  SERVICE_CREATED: 'SERVICE_CREATED',
  SERVICE_UPDATED: 'SERVICE_UPDATED',
  SERVICE_DELETED: 'SERVICE_DELETED',
  SERVICE_VERSION_CREATED: 'SERVICE_VERSION_CREATED',
  ARTIFACTS_GENERATED: 'ARTIFACTS_GENERATED',
  DEPLOYMENT_TRIGGERED: 'DEPLOYMENT_TRIGGERED',
  ROLLBACK_REQUESTED: 'ROLLBACK_REQUESTED',
  ROLLOUT_SUCCEEDED: 'ROLLOUT_SUCCEEDED',
  ROLLOUT_FAILED: 'ROLLOUT_FAILED',
  SCAN_STARTED: 'SCAN_STARTED',
  SCAN_PASSED: 'SCAN_PASSED',
  SCAN_FAILED: 'SCAN_FAILED',
  API_TOKEN_CREATED: 'API_TOKEN_CREATED',
  API_TOKEN_REVOKED: 'API_TOKEN_REVOKED',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
