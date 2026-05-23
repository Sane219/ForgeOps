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

  console.log('[seed] Creating security reports and findings...');
  const prodReport = await prisma.securityReport.create({
    data: {
      rolloutId: apiProdRollout.id, passed: true, score: 92,
      critical: 0, high: 0, medium: 1, low: 2, info: 3,
    },
  });
  await prisma.securityFinding.createMany({
    data: [
      { reportId: prodReport.id, kind: FindingKind.CONTAINER, severity: Severity.MEDIUM, ruleId: 'FS-001', title: 'Base image uses :latest tag', description: 'Dockerfile FROM node:22-bookworm-slim should pin a specific version', location: 'Dockerfile', remediation: 'Pin to node:22.x.x-bookworm-slim' },
      { reportId: prodReport.id, kind: FindingKind.LINT, severity: Severity.LOW, ruleId: 'FS-002', title: 'Missing healthcheck in Dockerfile', description: 'No HEALTHCHECK instruction found', location: 'Dockerfile', remediation: 'Add HEALTHCHECK --interval=30s CMD curl -f http://localhost:4000/healthz' },
      { reportId: prodReport.id, kind: FindingKind.LINT, severity: Severity.LOW, ruleId: 'FS-003', title: 'No .dockerignore detected', description: 'Build context may include unnecessary files', location: '.dockerignore', remediation: 'Create .dockerignore excluding node_modules, .git, *.md' },
    ],
  });

  const workerReport = await prisma.securityReport.create({
    data: {
      rolloutId: workerRollout.id, passed: false, score: 65,
      critical: 1, high: 1, medium: 0, low: 1, info: 0,
    },
  });
  await prisma.securityFinding.createMany({
    data: [
      { reportId: workerReport.id, kind: FindingKind.SECRET, severity: Severity.CRITICAL, ruleId: 'SEC-001', title: 'Hardcoded API key in environment', description: 'Environment variable contains what appears to be an API key', remediation: 'Move secret to a secrets manager or Kubernetes Secret' },
      { reportId: workerReport.id, kind: FindingKind.POLICY, severity: Severity.HIGH, ruleId: 'POL-001', title: 'Replicas < 2 in non-dev environment', description: 'Running only 1 replica with no failover', remediation: 'Set replicas >= 2 for redundancy' },
      { reportId: workerReport.id, kind: FindingKind.CONTAINER, severity: Severity.LOW, ruleId: 'FS-004', title: 'Container runs as root', description: 'No USER instruction in Dockerfile', remediation: 'Add USER nonroot:nonroot before CMD' },
    ],
  });

  console.log('[seed] Creating cost estimates...');
  await prisma.costEstimate.create({
    data: {
      rolloutId: apiProdRollout.id,
      monthlyUsd: 127.50, cpuUsd: 54.00, memoryUsd: 38.40, egressUsd: 15.10, storageUsd: 20.00,
      warnings: [{ level: 'INFO', message: 'CPU utilization averaging 35% — consider reducing to 500m' }],
      suggestions: [{ action: 'Right-size memory to 512Mi', estimatedSaving: 12.80 }],
      pricingVersion: 'v1',
    },
  });

  console.log('[seed] Creating metric samples...');
  const now = Date.now();
  await prisma.metricSample.createMany({
    data: Array.from({ length: 24 }, (_, i) => ({
      deploymentId: apiProdDeploy.id,
      ts: new Date(now - (24 - i) * 3600000),
      cpuPct: 20 + Math.sin(i / 3) * 15 + Math.random() * 10,
      memMb: 350 + Math.sin(i / 4) * 50 + Math.random() * 20,
      rps: 50 + Math.sin(i / 3) * 30 + Math.random() * 10,
      p95Ms: 45 + Math.sin(i / 5) * 20 + Math.random() * 10,
      errorRate: i === 18 ? 8.5 : Math.random() * 0.5,
    })),
  });

  console.log('[seed] Creating incidents...');
  await prisma.incident.create({
    data: {
      workspaceId: workspace.id, deploymentId: workerDevDeploy.id,
      title: 'ML Worker OOM on image batch processing',
      severity: Severity.HIGH, status: IncidentStatus.OPEN,
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
  console.log(`  Security:     2 reports with findings`);
  console.log(`  Metrics:      24 hourly samples for API prod`);
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
