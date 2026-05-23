-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DEVELOPER', 'VIEWER');

-- CreateEnum
CREATE TYPE "Runtime" AS ENUM ('NEXTJS', 'NESTJS', 'FASTAPI', 'PYTHON_WORKER', 'GO_SERVICE', 'STATIC');

-- CreateEnum
CREATE TYPE "EnvKind" AS ENUM ('DEV', 'STAGING', 'PROD');

-- CreateEnum
CREATE TYPE "RolloutStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "FindingKind" AS ENUM ('CONTAINER', 'SECRET', 'DEPENDENCY', 'LINT', 'POLICY');

-- CreateEnum
CREATE TYPE "ArtifactKind" AS ENUM ('DOCKERFILE', 'K8S_MANIFEST', 'HELM_VALUES', 'CI_PIPELINE', 'ARGO_APP');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_LOGGED_IN', 'USER_LOGGED_OUT', 'WORKSPACE_CREATED', 'MEMBER_INVITED', 'MEMBER_ROLE_CHANGED', 'MEMBER_REMOVED', 'SERVICE_CREATED', 'SERVICE_UPDATED', 'SERVICE_DELETED', 'SERVICE_VERSION_CREATED', 'ARTIFACTS_GENERATED', 'DEPLOYMENT_TRIGGERED', 'ROLLBACK_REQUESTED', 'ROLLOUT_SUCCEEDED', 'ROLLOUT_FAILED', 'SCAN_STARTED', 'SCAN_PASSED', 'SCAN_FAILED', 'API_TOKEN_CREATED', 'API_TOKEN_REVOKED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DEVELOPER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "kind" "EnvKind" NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "protected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "runtime" "Runtime" NOT NULL,
    "iconKey" TEXT NOT NULL,
    "defaultConfig" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "runtime" "Runtime" NOT NULL,
    "repoUrl" TEXT,
    "ownerId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_versions" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "replicas" INTEGER NOT NULL DEFAULT 2,
    "cpuMillicores" INTEGER NOT NULL DEFAULT 500,
    "memoryMb" INTEGER NOT NULL DEFAULT 512,
    "port" INTEGER NOT NULL DEFAULT 3000,
    "healthcheckPath" TEXT NOT NULL DEFAULT '/healthz',
    "envVars" JSONB NOT NULL DEFAULT '[]',
    "image" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "service_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" TEXT NOT NULL,
    "serviceVersionId" TEXT NOT NULL,
    "kind" "ArtifactKind" NOT NULL,
    "filename" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text/plain',
    "checksum" TEXT NOT NULL,
    "generatorVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "currentRolloutId" TEXT,
    "health" "HealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "restartCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rollouts" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "serviceVersionId" TEXT NOT NULL,
    "status" "RolloutStatus" NOT NULL DEFAULT 'PENDING',
    "imageTag" TEXT NOT NULL,
    "failureReason" TEXT,
    "triggeredById" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "rollouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_reports" (
    "id" TEXT NOT NULL,
    "rolloutId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "critical" INTEGER NOT NULL DEFAULT 0,
    "high" INTEGER NOT NULL DEFAULT 0,
    "medium" INTEGER NOT NULL DEFAULT 0,
    "low" INTEGER NOT NULL DEFAULT 0,
    "info" INTEGER NOT NULL DEFAULT 0,
    "scannerName" TEXT NOT NULL DEFAULT 'forgeops-mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_findings" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "kind" "FindingKind" NOT NULL,
    "severity" "Severity" NOT NULL,
    "ruleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "remediation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_estimates" (
    "id" TEXT NOT NULL,
    "rolloutId" TEXT NOT NULL,
    "monthlyUsd" DECIMAL(10,2) NOT NULL,
    "cpuUsd" DECIMAL(10,2) NOT NULL,
    "memoryUsd" DECIMAL(10,2) NOT NULL,
    "egressUsd" DECIMAL(10,2) NOT NULL,
    "storageUsd" DECIMAL(10,2) NOT NULL,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "suggestions" JSONB NOT NULL DEFAULT '[]',
    "pricingVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_samples" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "cpuPct" DOUBLE PRECISION NOT NULL,
    "memMb" DOUBLE PRECISION NOT NULL,
    "rps" DOUBLE PRECISION NOT NULL,
    "p95Ms" DOUBLE PRECISION NOT NULL,
    "errorRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "metric_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_entries" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,

    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "deploymentId" TEXT,
    "title" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "summary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "subjectKind" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rootCauses" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "subjectKind" TEXT,
    "subjectId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_tokens" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "memberships_workspaceId_idx" ON "memberships"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_workspaceId_key" ON "memberships"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "environments_workspaceId_kind_key" ON "environments"("workspaceId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "service_templates_key_key" ON "service_templates"("key");

-- CreateIndex
CREATE INDEX "services_workspaceId_idx" ON "services"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "services_workspaceId_slug_key" ON "services"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "service_versions_serviceId_idx" ON "service_versions"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "service_versions_serviceId_version_key" ON "service_versions"("serviceId", "version");

-- CreateIndex
CREATE INDEX "artifacts_serviceVersionId_idx" ON "artifacts"("serviceVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "artifacts_serviceVersionId_kind_filename_key" ON "artifacts"("serviceVersionId", "kind", "filename");

-- CreateIndex
CREATE UNIQUE INDEX "deployments_currentRolloutId_key" ON "deployments"("currentRolloutId");

-- CreateIndex
CREATE INDEX "deployments_serviceId_idx" ON "deployments"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "deployments_serviceId_environmentId_key" ON "deployments"("serviceId", "environmentId");

-- CreateIndex
CREATE INDEX "rollouts_deploymentId_startedAt_idx" ON "rollouts"("deploymentId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "security_reports_rolloutId_key" ON "security_reports"("rolloutId");

-- CreateIndex
CREATE INDEX "security_findings_reportId_severity_idx" ON "security_findings"("reportId", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "cost_estimates_rolloutId_key" ON "cost_estimates"("rolloutId");

-- CreateIndex
CREATE INDEX "metric_samples_deploymentId_ts_idx" ON "metric_samples"("deploymentId", "ts");

-- CreateIndex
CREATE INDEX "log_entries_deploymentId_ts_idx" ON "log_entries"("deploymentId", "ts");

-- CreateIndex
CREATE INDEX "incidents_workspaceId_startedAt_idx" ON "incidents"("workspaceId", "startedAt");

-- CreateIndex
CREATE INDEX "ai_analyses_subjectKind_subjectId_idx" ON "ai_analyses"("subjectKind", "subjectId");

-- CreateIndex
CREATE INDEX "ai_analyses_workspaceId_createdAt_idx" ON "ai_analyses"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_workspaceId_createdAt_idx" ON "audit_events"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_subjectKind_subjectId_idx" ON "audit_events"("subjectKind", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_prefix_key" ON "api_tokens"("prefix");

-- CreateIndex
CREATE INDEX "api_tokens_workspaceId_idx" ON "api_tokens"("workspaceId");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "service_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_versions" ADD CONSTRAINT "service_versions_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_versions" ADD CONSTRAINT "service_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_serviceVersionId_fkey" FOREIGN KEY ("serviceVersionId") REFERENCES "service_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_currentRolloutId_fkey" FOREIGN KEY ("currentRolloutId") REFERENCES "rollouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollouts" ADD CONSTRAINT "rollouts_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollouts" ADD CONSTRAINT "rollouts_serviceVersionId_fkey" FOREIGN KEY ("serviceVersionId") REFERENCES "service_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_reports" ADD CONSTRAINT "security_reports_rolloutId_fkey" FOREIGN KEY ("rolloutId") REFERENCES "rollouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_findings" ADD CONSTRAINT "security_findings_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "security_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimates" ADD CONSTRAINT "cost_estimates_rolloutId_fkey" FOREIGN KEY ("rolloutId") REFERENCES "rollouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

