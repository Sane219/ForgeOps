import { PrismaClient, Role, Runtime, EnvKind, RolloutStatus, HealthStatus, AuditAction, Severity, FindingKind, IncidentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildRenderContext, renderArtifacts } from '../src/modules/generator/render';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

const RUNTIME_TEMPLATE_MAP: Record<string, string> = {
  NEXTJS: 'nextjs-app',
  NESTJS: 'nestjs-api',
  FASTAPI: 'fastapi-service',
  PYTHON_WORKER: 'python-worker',
  GO_SERVICE: 'go-service',
};

async function main() {
  console.log('[seed] Cleaning existing data...');
  await prisma.$executeRaw`TRUNCATE TABLE "ai_analyses", "audit_events", "api_tokens", "incidents", "log_entries", "metric_samples", "cost_estimates", "security_findings", "security_reports", "rollouts", "deployments", "artifacts", "service_versions", "services", "service_templates", "environments", "memberships", "workspaces", "users" CASCADE`;

  console.log('[seed] Creating demo users...');
  const passwordHash = await bcrypt.hash('password123', BCRYPT_ROUNDS);

  const admin = await prisma.user.create({
    data: { email: 'admin@forgeops.dev', name: 'Alice Nguyen', passwordHash },
  });
  const dev = await prisma.user.create({
    data: { email: 'dev@forgeops.dev', name: 'Bob Chen', passwordHash },
  });

  console.log('[seed] Creating workspace with environments...');
  const workspace = await prisma.workspace.create({
    data: {
      slug: 'acme-corp',
      name: 'Acme Corporation',
      description: 'Main development workspace for Acme Corp',
      environments: {
        create: [
          { kind: EnvKind.DEV, name: 'Development' },
          { kind: EnvKind.STAGING, name: 'Staging' },
          { kind: EnvKind.PROD, name: 'Production', protected: true },
        ],
      },
      memberships: {
        create: [
          { userId: admin.id, role: Role.ADMIN },
          { userId: dev.id, role: Role.DEVELOPER },
        ],
      },
    },
    include: { environments: true },
  });

  const devEnv = workspace.environments.find((e) => e.kind === EnvKind.DEV)!;
  const stagingEnv = workspace.environments.find((e) => e.kind === EnvKind.STAGING)!;
  const prodEnv = workspace.environments.find((e) => e.kind === EnvKind.PROD)!;

  console.log('[seed] Creating service templates...');
  const [nextjsTpl, nestjsTpl, fastapiTpl, pythonWorkerTpl, goServiceTpl] = await Promise.all([
    prisma.serviceTemplate.create({
      data: {
        key: 'nextjs-app', name: 'Next.js App', description: 'Production-ready Next.js 15 application with TypeScript and Tailwind.',
        runtime: Runtime.NEXTJS, iconKey: 'globe',
        defaultConfig: { port: 3000, healthcheckPath: '/api/health', envVars: [{ key: 'NEXT_TELEMETRY_DISABLED', value: '1', secret: false }] },
      },
    }),
    prisma.serviceTemplate.create({
      data: {
        key: 'nestjs-api', name: 'NestJS API', description: 'NestJS HTTP API with Pino logging, Swagger, and a /healthz endpoint.',
        runtime: Runtime.NESTJS, iconKey: 'server',
        defaultConfig: { port: 4000, healthcheckPath: '/healthz', envVars: [] },
      },
    }),
    prisma.serviceTemplate.create({
      data: {
        key: 'fastapi-service', name: 'Python FastAPI', description: 'FastAPI service with Uvicorn, structured logging, and /healthz.',
        runtime: Runtime.FASTAPI, iconKey: 'zap',
        defaultConfig: { port: 8000, healthcheckPath: '/healthz', envVars: [] },
      },
    }),
    prisma.serviceTemplate.create({
      data: {
        key: 'python-worker', name: 'Python Worker', description: 'Background worker with Celery or RQ, Redis-backed task queue.',
        runtime: Runtime.PYTHON_WORKER, iconKey: 'activity',
        defaultConfig: { port: 8000, healthcheckPath: '/healthz', envVars: [{ key: 'REDIS_URL', value: 'redis://localhost:6379', secret: false }] },
      },
    }),
    prisma.serviceTemplate.create({
      data: {
        key: 'go-service', name: 'Go Service', description: 'High-performance Go HTTP service with chi router and structured logging.',
        runtime: Runtime.GO_SERVICE, iconKey: 'bolt',
        defaultConfig: { port: 8080, healthcheckPath: '/healthz', envVars: [] },
      },
    }),
  ]);

  console.log('[seed] Creating services...');
  const apiService = await prisma.service.create({
    data: {
      workspaceId: workspace.id,
      templateId: nestjsTpl.id,
      name: 'acme-api', slug: 'acme-api', description: 'Core REST API for Acme products',
      runtime: Runtime.NESTJS, repoUrl: 'https://github.com/acme/acme-api', ownerId: admin.id,
      tags: ['backend', 'api', 'core'],
    },
  });
  const webService = await prisma.service.create({
    data: {
      workspaceId: workspace.id,
      templateId: nextjsTpl.id,
      name: 'acme-web', slug: 'acme-web', description: 'Customer-facing web application',
      runtime: Runtime.NEXTJS, repoUrl: 'https://github.com/acme/acme-web', ownerId: dev.id,
      tags: ['frontend', 'web'],
    },
  });
  const workerService = await prisma.service.create({
    data: {
      workspaceId: workspace.id,
      templateId: fastapiTpl.id,
      name: 'acme-worker', slug: 'acme-worker', description: 'ML inference worker for image classification',
      runtime: Runtime.FASTAPI, repoUrl: 'https://github.com/acme/acme-worker', ownerId: dev.id,
      tags: ['worker', 'ml', 'python'],
    },
  });

  console.log('[seed] Creating service versions...');
  const apiV1 = await prisma.serviceVersion.create({
    data: {
      serviceId: apiService.id, version: 1, replicas: 2, cpuMillicores: 500, memoryMb: 512,
      port: 4000, healthcheckPath: '/healthz',
      envVars: [
        { key: 'DATABASE_URL', value: 'postgresql://acme:***@postgres:5432/acme', secret: true },
        { key: 'REDIS_URL', value: 'redis://redis:6379', secret: false },
      ],
      image: 'ghcr.io/acme/acme-api:v1', notes: 'Initial API deployment', createdById: admin.id,
    },
  });
  const webV1 = await prisma.serviceVersion.create({
    data: {
      serviceId: webService.id, version: 1, replicas: 2, cpuMillicores: 250, memoryMb: 256,
      port: 3000, healthcheckPath: '/api/health',
      envVars: [
        { key: 'NEXT_PUBLIC_API_BASE_URL', value: 'https://api.acme.dev', secret: false },
        { key: 'DATABASE_URL', value: 'postgresql://acme:***@postgres:5432/acme', secret: true },
      ],
      image: 'ghcr.io/acme/acme-web:v1', notes: 'Initial web deploy', createdById: dev.id,
    },
  });
  const workerV1 = await prisma.serviceVersion.create({
    data: {
      serviceId: workerService.id, version: 1, replicas: 1, cpuMillicores: 1000, memoryMb: 2048,
      port: 8000, healthcheckPath: '/healthz',
      envVars: [
        { key: 'MODEL_PATH', value: '/models/classifier-v2.onnx', secret: false },
        { key: 'REDIS_URL', value: 'redis://redis:6379', secret: false },
      ],
      image: 'ghcr.io/acme/acme-worker:v1', notes: 'Initial worker deploy', createdById: dev.id,
    },
  });

  // v2 for the API (shows version history in UI)
  await prisma.serviceVersion.create({
    data: {
      serviceId: apiService.id, version: 2, replicas: 3, cpuMillicores: 750, memoryMb: 768,
      port: 4000, healthcheckPath: '/healthz',
      envVars: [
        { key: 'DATABASE_URL', value: 'postgresql://acme:***@postgres:5432/acme', secret: true },
        { key: 'REDIS_URL', value: 'redis://redis:6379', secret: false },
        { key: 'FEATURE_RATE_LIMIT', value: 'true', secret: false },
      ],
      image: 'ghcr.io/acme/acme-api:v2', notes: 'Added rate limiting, bumped resources', createdById: admin.id,
    },
  });

  // ── Generate artifacts using shared render function ─────────
  console.log('[seed] Generating artifacts...');

  const versionsToGenerate = [
    { service: apiService, version: apiV1 },
    { service: webService, version: webV1 },
    { service: workerService, version: workerV1 },
  ];

  for (const { service, version } of versionsToGenerate) {
    const templateDir = RUNTIME_TEMPLATE_MAP[service.runtime] ?? 'nestjs-api';
    const ctx = buildRenderContext({
      service: {
        name: service.name,
        slug: service.slug,
        runtime: service.runtime,
        port: version.port,
        healthcheckPath: version.healthcheckPath,
        replicas: version.replicas,
        cpuMillicores: version.cpuMillicores,
        memoryMb: version.memoryMb,
        envVars: (version.envVars as Array<{ key: string; value: string; secret: boolean }>) ?? [],
      },
      version: {
        version: version.version,
        image: version.image,
      },
      workspace: { slug: workspace.slug, name: workspace.name },
    });

    const rendered = renderArtifacts(templateDir, ctx);
    for (const [kind, artifact] of rendered) {
      await prisma.artifact.create({
        data: {
          serviceVersionId: version.id,
          kind,
          filename: artifact.filename,
          content: artifact.content,
          contentType: artifact.contentType,
          checksum: artifact.checksum,
          generatorVersion: '0.1.0',
        },
      });
    }
    console.log(`  → ${service.slug} v${version.version}: ${rendered.size} artifacts`);
  }

  console.log('[seed] Creating deployments and rollouts...');
  const apiDevDeploy = await prisma.deployment.create({
    data: { serviceId: apiService.id, environmentId: devEnv.id, health: HealthStatus.HEALTHY, lastUpdatedAt: new Date() },
  });
  const apiStagingDeploy = await prisma.deployment.create({
    data: { serviceId: apiService.id, environmentId: stagingEnv.id, health: HealthStatus.HEALTHY, lastUpdatedAt: new Date() },
  });
  const apiProdDeploy = await prisma.deployment.create({
    data: { serviceId: apiService.id, environmentId: prodEnv.id, health: HealthStatus.HEALTHY, lastUpdatedAt: new Date() },
  });
  const webDevDeploy = await prisma.deployment.create({
    data: { serviceId: webService.id, environmentId: devEnv.id, health: HealthStatus.HEALTHY, lastUpdatedAt: new Date() },
  });
  const webStagingDeploy = await prisma.deployment.create({
    data: { serviceId: webService.id, environmentId: stagingEnv.id, health: HealthStatus.UNKNOWN, lastUpdatedAt: new Date() },
  });
  const workerDevDeploy = await prisma.deployment.create({
    data: { serviceId: workerService.id, environmentId: devEnv.id, health: HealthStatus.DEGRADED, lastUpdatedAt: new Date() },
  });

  const apiProdRollout = await prisma.rollout.create({
    data: {
      deploymentId: apiProdDeploy.id, serviceVersionId: apiV1.id, status: RolloutStatus.SUCCEEDED,
      imageTag: 'ghcr.io/acme/acme-api:v1', triggeredById: admin.id,
      startedAt: new Date(Date.now() - 3600000 * 24), finishedAt: new Date(Date.now() - 3600000 * 23),
    },
  });
  await prisma.deployment.update({ where: { id: apiProdDeploy.id }, data: { currentRolloutId: apiProdRollout.id } });

  const webDevRollout = await prisma.rollout.create({
    data: {
      deploymentId: webDevDeploy.id, serviceVersionId: webV1.id, status: RolloutStatus.SUCCEEDED,
      imageTag: 'ghcr.io/acme/acme-web:v1', triggeredById: dev.id,
      startedAt: new Date(Date.now() - 3600000 * 12), finishedAt: new Date(Date.now() - 3600000 * 11),
    },
  });
  await prisma.deployment.update({ where: { id: webDevDeploy.id }, data: { currentRolloutId: webDevRollout.id } });

  const workerRollout = await prisma.rollout.create({
    data: {
      deploymentId: workerDevDeploy.id, serviceVersionId: workerV1.id, status: RolloutStatus.FAILED,
      imageTag: 'ghcr.io/acme/acme-worker:v1', triggeredById: dev.id,
      failureReason: 'OOMKilled: container exceeded 2Gi memory limit',
      startedAt: new Date(Date.now() - 3600000 * 2), finishedAt: new Date(Date.now() - 3600000),
    },
  });
  await prisma.deployment.update({ where: { id: workerDevDeploy.id }, data: { currentRolloutId: workerRollout.id } });

  const apiStagingRollout = await prisma.rollout.create({
    data: {
      deploymentId: apiStagingDeploy.id, serviceVersionId: apiV1.id, status: RolloutStatus.IN_PROGRESS,
      imageTag: 'ghcr.io/acme/acme-api:v1', triggeredById: admin.id,
      startedAt: new Date(Date.now() - 300000),
    },
  });
  await prisma.deployment.update({ where: { id: apiStagingDeploy.id }, data: { currentRolloutId: apiStagingRollout.id } });

  // ── Security reports for all rollouts ───────────────────────
  console.log('[seed] Creating security reports and findings...');
  const apiProdReport = await prisma.securityReport.create({
    data: {
      rolloutId: apiProdRollout.id, passed: true, score: 92,
      critical: 0, high: 0, medium: 1, low: 2, info: 3,
      scannerName: 'forgeops-mock',
    },
  });
  await prisma.securityFinding.createMany({
    data: [
      { reportId: apiProdReport.id, kind: FindingKind.CONTAINER, severity: Severity.MEDIUM, ruleId: 'SEC-003', title: 'Base image uses :latest tag', description: 'Dockerfile FROM node:22-bookworm-slim should pin a specific version', location: 'Dockerfile', remediation: 'Pin to node:22.x.x-bookworm-slim' },
      { reportId: apiProdReport.id, kind: FindingKind.LINT, severity: Severity.LOW, ruleId: 'SEC-010', title: 'Config sprawl — 18 environment variables', description: 'Service has 18 environment variables, indicating possible configuration sprawl', location: 'envVars', remediation: 'Group related config into files or a config service' },
      { reportId: apiProdReport.id, kind: FindingKind.DEPENDENCY, severity: Severity.INFO, ruleId: 'SEC-007', title: 'Infrastructure dependency: DATABASE_URL', description: 'Service depends on PostgreSQL via DATABASE_URL', location: 'envVars.DATABASE_URL', remediation: 'Include database in SLO monitoring' },
      { reportId: apiProdReport.id, kind: FindingKind.DEPENDENCY, severity: Severity.INFO, ruleId: 'SEC-007', title: 'Infrastructure dependency: REDIS_URL', description: 'Service depends on Redis via REDIS_URL', location: 'envVars.REDIS_URL', remediation: 'Include Redis in SLO monitoring' },
      { reportId: apiProdReport.id, kind: FindingKind.SECRET, severity: Severity.CRITICAL, ruleId: 'SEC-001', title: 'Suspicious secret in environment variable', description: 'Variable "DATABASE_URL" appears to contain a secret value', location: 'envVars.DATABASE_URL', remediation: 'Move to a dedicated secrets manager' },
      { reportId: apiProdReport.id, kind: FindingKind.LINT, severity: Severity.LOW, ruleId: 'SEC-004', title: 'Health check path may be insufficient', description: 'Health check path "/healthz" — verify it checks all critical dependencies', location: 'healthcheckPath', remediation: 'Ensure /healthz checks DB, cache, and external dependencies' },
    ],
  });

  const webDevReport = await prisma.securityReport.create({
    data: {
      rolloutId: webDevRollout.id, passed: true, score: 85,
      critical: 1, high: 0, medium: 1, low: 1, info: 1,
      scannerName: 'forgeops-mock',
    },
  });
  await prisma.securityFinding.createMany({
    data: [
      { reportId: webDevReport.id, kind: FindingKind.SECRET, severity: Severity.CRITICAL, ruleId: 'SEC-001', title: 'Suspicious secret in environment variable', description: 'Variable "DATABASE_URL" appears to contain a secret value', location: 'envVars.DATABASE_URL', remediation: 'Move to a dedicated secrets manager' },
      { reportId: webDevReport.id, kind: FindingKind.CONTAINER, severity: Severity.MEDIUM, ruleId: 'SEC-003', title: 'Base image may use unpinned tag', description: 'Dockerfile FROM node:22-alpine should pin a specific version', location: 'Dockerfile', remediation: 'Pin to node:22.x.x-alpine' },
      { reportId: webDevReport.id, kind: FindingKind.DEPENDENCY, severity: Severity.INFO, ruleId: 'SEC-007', title: 'Infrastructure dependency: DATABASE_URL', description: 'Service depends on PostgreSQL', location: 'envVars.DATABASE_URL', remediation: 'Include database in SLO monitoring' },
      { reportId: webDevReport.id, kind: FindingKind.LINT, severity: Severity.LOW, ruleId: 'SEC-004', title: 'Health check path "/api/health"', description: 'Verify health endpoint checks all critical subsystems', location: 'healthcheckPath', remediation: 'Ensure health endpoint validates database connectivity' },
    ],
  });

  const workerReport = await prisma.securityReport.create({
    data: {
      rolloutId: workerRollout.id, passed: false, score: 55,
      critical: 1, high: 2, medium: 0, low: 1, info: 1,
      scannerName: 'forgeops-mock',
    },
  });
  await prisma.securityFinding.createMany({
    data: [
      { reportId: workerReport.id, kind: FindingKind.CONTAINER, severity: Severity.HIGH, ruleId: 'SEC-002', title: 'No CPU resource limit set', description: 'Container has no CPU limit configured. Allows unbounded CPU consumption.', location: 'serviceVersion.cpuMillicores', remediation: 'Set a CPU resource limit (e.g., 1000m)' },
      { reportId: workerReport.id, kind: FindingKind.CONTAINER, severity: Severity.HIGH, ruleId: 'SEC-005', title: 'Container may run as root', description: 'No USER instruction found in Dockerfile. Containers default to running as root.', location: 'Dockerfile', remediation: 'Add USER nonroot:nonroot before CMD instruction' },
      { reportId: workerReport.id, kind: FindingKind.POLICY, severity: Severity.CRITICAL, ruleId: 'SEC-006', title: 'Single replica in non-development environment', description: 'Running only 1 replica. A single point of failure will cause downtime.', location: 'serviceVersion.replicas', remediation: 'Set replicas >= 2 for redundancy' },
      { reportId: workerReport.id, kind: FindingKind.DEPENDENCY, severity: Severity.INFO, ruleId: 'SEC-007', title: 'Infrastructure dependency: REDIS_URL', description: 'Service depends on Redis via REDIS_URL', location: 'envVars.REDIS_URL', remediation: 'Include Redis in SLO monitoring' },
      { reportId: workerReport.id, kind: FindingKind.LINT, severity: Severity.LOW, ruleId: 'SEC-004', title: 'Missing health check path', description: 'No dedicated health check endpoint configured', location: 'healthcheckPath', remediation: 'Add a /healthz endpoint' },
    ],
  });

  // ── Cost estimates for all rollouts ─────────────────────────
  console.log('[seed] Creating cost estimates...');
  // Pricing (CostService rates): CPU $0.00003/millicore-hr, mem $0.00005/MB-hr, egress $0.09/GB, storage $0.10/GB-mo
  // api-prod: 2 replicas * (500 * 730 * 0.00003 + 512 * 730 * 0.00005) + 50*0.09 + 10*0.10
  //         = 2 * (10.95 + 18.69) + 4.50 + 1.00 = 64.78
  await prisma.costEstimate.create({
    data: {
      rolloutId: apiProdRollout.id,
      monthlyUsd: 64.78, cpuUsd: 21.90, memoryUsd: 37.38, egressUsd: 4.50, storageUsd: 1.00,
      warnings: [
        { code: 'MEMORY_CPU_RATIO', message: 'Memory-to-CPU ratio is high (1.02 MB per millicore)', severity: 'WARN' },
      ],
      suggestions: [
        { code: 'RIGHTSIZE_MEMORY', message: 'Reduce memory from 512Mi to 256Mi if workload permits', estimatedMonthlySavingsUsd: 18.69 },
      ],
      pricingVersion: 'v1',
    },
  });
  // web-dev: 2 replicas * (250 * 730 * 0.00003 + 256 * 730 * 0.00005) + 50*0.09 + 10*0.10
  //        = 2 * (5.48 + 9.34) + 5.50 = 35.14
  await prisma.costEstimate.create({
    data: {
      rolloutId: webDevRollout.id,
      monthlyUsd: 35.14, cpuUsd: 10.95, memoryUsd: 18.69, egressUsd: 4.50, storageUsd: 1.00,
      warnings: [],
      suggestions: [],
      pricingVersion: 'v1',
    },
  });
  // worker-dev: 1 replica * (1000 * 730 * 0.00003 + 2048 * 730 * 0.00005) + 50*0.09 + 10*0.10
  //           = (21.90 + 74.75) + 5.50 = 102.15
  await prisma.costEstimate.create({
    data: {
      rolloutId: workerRollout.id,
      monthlyUsd: 102.15, cpuUsd: 21.90, memoryUsd: 74.75, egressUsd: 4.50, storageUsd: 1.00,
      warnings: [
        { code: 'HIGH_MEMORY', message: 'Memory is set to 2048Mi — this may be overprovisioned', severity: 'WARN' },
      ],
      suggestions: [
        { code: 'RIGHTSIZE_MEMORY', message: 'Reduce memory from 2048Mi to 1024Mi if workload permits', estimatedMonthlySavingsUsd: 37.38 },
      ],
      pricingVersion: 'v1',
    },
  });
  // api-staging: 2 replicas * (500 * 730 * 0.00003 + 512 * 730 * 0.00005) + 50*0.09 + 10*0.10 = 64.78
  await prisma.costEstimate.create({
    data: {
      rolloutId: apiStagingRollout.id,
      monthlyUsd: 64.78, cpuUsd: 21.90, memoryUsd: 37.38, egressUsd: 4.50, storageUsd: 1.00,
      warnings: [],
      suggestions: [],
      pricingVersion: 'v1',
    },
  });

  // ── Metric samples for all deployments ──────────────────────
  console.log('[seed] Creating metric samples...');
  const now = Date.now();

  // Helper: deterministic noise
  const detNoise = (seed: number, i: number, salt: number) => {
    const h = ((seed * 2654435761 + i * 2246822519 + salt * 3266489917) >>> 0) % 100;
    return h / 100;
  };

  // API PROD — healthy diurnal pattern
  await prisma.metricSample.createMany({
    data: Array.from({ length: 24 }, (_, i) => {
      const diurnal = Math.max(0, Math.sin((i - 6) * Math.PI / 12));
      return {
        deploymentId: apiProdDeploy.id,
        ts: new Date(now - (24 - i) * 3600000),
        cpuPct: 15 + diurnal * 20 + detNoise(1, i, 0) * 8,
        memMb: 250 + diurnal * 100 + detNoise(1, i, 1) * 20,
        rps: 30 + diurnal * 50 + detNoise(1, i, 2) * 10,
        p95Ms: 30 + diurnal * 25 + detNoise(1, i, 3) * 15,
        errorRate: 0.05 + detNoise(1, i, 4) * 0.3,
      };
    }),
  });

  // WEB DEV — healthy but lower traffic
  await prisma.metricSample.createMany({
    data: Array.from({ length: 24 }, (_, i) => {
      const diurnal = Math.max(0, Math.sin((i - 6) * Math.PI / 12));
      return {
        deploymentId: webDevDeploy.id,
        ts: new Date(now - (24 - i) * 3600000),
        cpuPct: 10 + diurnal * 15 + detNoise(2, i, 0) * 5,
        memMb: 180 + diurnal * 60 + detNoise(2, i, 1) * 10,
        rps: 10 + diurnal * 30 + detNoise(2, i, 2) * 5,
        p95Ms: 25 + diurnal * 15 + detNoise(2, i, 3) * 8,
        errorRate: 0.02 + detNoise(2, i, 4) * 0.2,
      };
    }),
  });

  // WORKER DEV — OOMKilled pattern: rising memory, crash, restart, rising again
  await prisma.metricSample.createMany({
    data: Array.from({ length: 24 }, (_, i) => {
      const cycleHour = i % 12;
      const memRising = cycleHour < 10;
      return {
        deploymentId: workerDevDeploy.id,
        ts: new Date(now - (24 - i) * 3600000),
        cpuPct: memRising ? 30 + cycleHour * 5 : 5,
        memMb: memRising ? 500 + cycleHour * 180 : 100,
        rps: memRising ? 20 : 0,
        p95Ms: memRising ? 50 + cycleHour * 20 : 0,
        errorRate: memRising ? cycleHour * 1.5 : 15,
      };
    }),
  });

  // API STAGING — in-progress, partial data
  await prisma.metricSample.createMany({
    data: Array.from({ length: 6 }, (_, i) => ({
      deploymentId: apiStagingDeploy.id,
      ts: new Date(now - (6 - i) * 3600000),
      cpuPct: 12 + detNoise(4, i, 0) * 10,
      memMb: 200 + detNoise(4, i, 1) * 30,
      rps: 0,
      p95Ms: 0,
      errorRate: 0,
    })),
  });

  // ── Log entries for key deployments ─────────────────────────
  console.log('[seed] Creating log entries...');
  const logStepMs = 15000; // 1 log per 15s

  // API PROD — healthy startup + request logs
  const apiProdLogs = [
    { level: 'INFO', message: 'Starting application...' },
    { level: 'INFO', message: 'Connected to database' },
    { level: 'INFO', message: 'HTTP server listening on port 4000' },
    { level: 'INFO', message: 'Readiness probe: /healthz — 200 OK' },
    { level: 'INFO', message: 'Service ready to accept traffic' },
    { level: 'INFO', message: 'GET /api/v1/status 200 — 8ms' },
    { level: 'INFO', message: 'POST /api/v1/data 201 — 35ms' },
    { level: 'DEBUG', message: 'Cache hit ratio: 94.2%' },
    { level: 'INFO', message: 'Background job completed: session cleanup' },
    { level: 'INFO', message: 'GET /healthz 200 — 1ms' },
    { level: 'INFO', message: 'GET /api/v1/items 200 — 12ms' },
    { level: 'WARN', message: 'Slow query detected: SELECT * FROM orders (234ms)' },
    { level: 'INFO', message: 'GET /api/v1/orders 200 — 234ms' },
    { level: 'DEBUG', message: 'Connection pool: 8/20 active' },
    { level: 'INFO', message: 'Background job completed: metrics flush' },
  ];
  await prisma.logEntry.createMany({
    data: apiProdLogs.map((log, i) => ({
      deploymentId: apiProdDeploy.id,
      ts: new Date(now - (apiProdLogs.length - i) * logStepMs),
      level: log.level,
      message: log.message,
      meta: { rolloutId: apiProdRollout.id },
    })),
  });

  // WORKER DEV — OOMKilled crash sequence
  const workerLogs = [
    { level: 'INFO', message: 'Starting application...' },
    { level: 'INFO', message: 'Connected to database' },
    { level: 'INFO', message: 'Loading ML model from /models/classifier-v2.onnx...' },
    { level: 'INFO', message: 'Model loaded in 4.2s, warming up...' },
    { level: 'INFO', message: 'Warmup complete, accepting jobs' },
    { level: 'INFO', message: 'Processing batch: 50 images queued' },
    { level: 'WARN', message: 'Memory usage at 72% of limit (1474Mi / 2048Mi)' },
    { level: 'INFO', message: 'Processed 20/50 images' },
    { level: 'WARN', message: 'Memory usage at 85% of limit (1740Mi / 2048Mi)' },
    { level: 'WARN', message: 'Memory usage at 92% of limit (1884Mi / 2048Mi)' },
    { level: 'ERROR', message: 'OOMKilled: container exceeded memory limit (2048Mi)' },
    { level: 'INFO', message: 'Container restarting after OOMKill...' },
    { level: 'INFO', message: 'Starting application...' },
    { level: 'WARN', message: 'Memory usage climbing rapidly — 78% within 30s of restart' },
    { level: 'ERROR', message: 'OOMKilled: container exceeded memory limit (2048Mi)' },
    { level: 'ERROR', message: 'CrashLoopBackOff: container repeatedly crashing' },
  ];
  await prisma.logEntry.createMany({
    data: workerLogs.map((log, i) => ({
      deploymentId: workerDevDeploy.id,
      ts: new Date(now - (workerLogs.length - i) * logStepMs),
      level: log.level,
      message: log.message,
      meta: { rolloutId: workerRollout.id },
    })),
  });

  // WEB DEV — healthy but shorter
  const webDevLogs = [
    { level: 'INFO', message: 'Starting Next.js application...' },
    { level: 'INFO', message: 'Next.js 15.0 ready on port 3000' },
    { level: 'INFO', message: 'GET / 200 — 45ms' },
    { level: 'INFO', message: 'GET /api/health 200 — 2ms' },
    { level: 'INFO', message: 'GET /products 200 — 120ms' },
    { level: 'DEBUG', message: 'ISR revalidation triggered for /products' },
    { level: 'INFO', message: 'GET /api/cart 200 — 18ms' },
  ];
  await prisma.logEntry.createMany({
    data: webDevLogs.map((log, i) => ({
      deploymentId: webDevDeploy.id,
      ts: new Date(now - (webDevLogs.length - i) * logStepMs),
      level: log.level,
      message: log.message,
      meta: { rolloutId: webDevRollout.id },
    })),
  });

  // ── Incidents ───────────────────────────────────────────────
  console.log('[seed] Creating incidents...');
  await prisma.incident.create({
    data: {
      workspaceId: workspace.id, deploymentId: workerDevDeploy.id,
      title: 'Container OOMKill detected',
      severity: Severity.CRITICAL, status: IncidentStatus.OPEN,
      summary: 'The acme-worker container was OOMKilled while processing a batch of 50 high-res images. Memory limit of 2Gi is insufficient for the current model.',
      startedAt: new Date(Date.now() - 3600000),
    },
  });

  console.log('[seed] Creating audit events...');
  await prisma.auditEvent.createMany({
    data: [
      { workspaceId: workspace.id, actorId: admin.id, action: AuditAction.WORKSPACE_CREATED, subjectKind: 'workspace', subjectId: workspace.id },
      { workspaceId: workspace.id, actorId: admin.id, action: AuditAction.SERVICE_CREATED, subjectKind: 'service', subjectId: apiService.id, metadata: { name: 'acme-api' } },
      { workspaceId: workspace.id, actorId: dev.id, action: AuditAction.SERVICE_CREATED, subjectKind: 'service', subjectId: webService.id, metadata: { name: 'acme-web' } },
      { workspaceId: workspace.id, actorId: dev.id, action: AuditAction.SERVICE_CREATED, subjectKind: 'service', subjectId: workerService.id, metadata: { name: 'acme-worker' } },
      { workspaceId: workspace.id, actorId: admin.id, action: AuditAction.ARTIFACTS_GENERATED, subjectKind: 'service', subjectId: apiService.id, metadata: { version: 1 } },
      { workspaceId: workspace.id, actorId: dev.id, action: AuditAction.ARTIFACTS_GENERATED, subjectKind: 'service', subjectId: webService.id, metadata: { version: 1 } },
      { workspaceId: workspace.id, actorId: dev.id, action: AuditAction.ARTIFACTS_GENERATED, subjectKind: 'service', subjectId: workerService.id, metadata: { version: 1 } },
      { workspaceId: workspace.id, actorId: admin.id, action: AuditAction.DEPLOYMENT_TRIGGERED, subjectKind: 'rollout', subjectId: apiProdRollout.id, metadata: { environment: 'PROD', imageTag: 'ghcr.io/acme/acme-api:v1' } },
      { workspaceId: workspace.id, actorId: dev.id, action: AuditAction.DEPLOYMENT_TRIGGERED, subjectKind: 'rollout', subjectId: webDevRollout.id, metadata: { environment: 'DEV', imageTag: 'ghcr.io/acme/acme-web:v1' } },
      { workspaceId: workspace.id, actorId: dev.id, action: AuditAction.ROLLOUT_FAILED, subjectKind: 'rollout', subjectId: workerRollout.id, metadata: { reason: 'OOMKilled' } },
      { workspaceId: workspace.id, actorId: admin.id, action: AuditAction.MEMBER_INVITED, subjectKind: 'user', subjectId: dev.id, metadata: { role: 'DEVELOPER' } },
    ],
  });

  // Count artifacts
  const artifactCount = await prisma.artifact.count();

  console.log('[seed] Done! Summary:');
  console.log(`  Users:        2 (admin@forgeops.dev / dev@forgeops.dev — password: password123)`);
  console.log(`  Workspace:    1 (acme-corp) with DEV/STAGING/PROD environments`);
  console.log(`  Templates:    5`);
  console.log(`  Services:     3 (acme-api, acme-web, acme-worker)`);
  console.log(`  Artifacts:    ${artifactCount} generated from Handlebars templates`);
  console.log(`  Deployments:  6 across environments`);
  console.log(`  Rollouts:     4 (2 succeeded, 1 failed, 1 in-progress)`);
  console.log(`  Security:     4 reports with findings (all rollouts)`);
  console.log(`  Cost:         4 estimates (all rollouts)`);
  console.log(`  Metrics:      78 hourly samples across 4 deployments`);
  console.log(`  Logs:         38 entries across 3 deployments`);
  console.log(`  Incidents:    1 open (worker OOM)`);
  console.log(`  Audit:        11 events`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
