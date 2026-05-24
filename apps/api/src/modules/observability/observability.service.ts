import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IncidentStatus, RolloutStatus, Severity, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { METRICS_PROVIDER, type MetricsProvider } from '../../providers/metrics/metrics-provider.interface';
import { LOGS_PROVIDER, type LogsProvider, type LogLevel } from '../../providers/logs/logs-provider.interface';
import type { LogsQueryInput } from '@forgeops/types';

interface FailureLogPattern {
  messages: Array<{ level: LogLevel; message: string; afterMinutes: number }>;
  incidentTitle: string;
  incidentSummary: string;
}

const FAILURE_PATTERNS: Record<string, FailureLogPattern> = {
  OOMKilled: {
    messages: [
      { level: 'INFO', message: 'Starting application...', afterMinutes: 0 },
      { level: 'INFO', message: 'Application started, loading ML model...', afterMinutes: 1 },
      { level: 'WARN', message: 'Memory usage at 82% of limit (1680Mi / 2048Mi)', afterMinutes: 5 },
      { level: 'WARN', message: 'Memory usage at 91% of limit (1864Mi / 2048Mi)', afterMinutes: 8 },
      { level: 'ERROR', message: 'OOMKilled: container exceeded memory limit (2048Mi)', afterMinutes: 10 },
      { level: 'INFO', message: 'Container restarting after OOMKill...', afterMinutes: 10 },
      { level: 'INFO', message: 'Starting application...', afterMinutes: 11 },
      { level: 'WARN', message: 'Memory usage climbing — 78% within 30s of restart', afterMinutes: 12 },
      { level: 'ERROR', message: 'OOMKilled: container exceeded memory limit (2048Mi)', afterMinutes: 14 },
    ],
    incidentTitle: 'Container OOMKill detected',
    incidentSummary: 'Container was killed for exceeding its memory limit. The workload requires more memory than allocated, or there is a memory leak.',
  },
  ImagePullBackOff: {
    messages: [
      { level: 'INFO', message: 'Pulling image from registry...', afterMinutes: 0 },
      { level: 'ERROR', message: 'Failed to pull image: manifest unknown to registry', afterMinutes: 1 },
      { level: 'WARN', message: 'Retrying image pull (attempt 2)...', afterMinutes: 2 },
      { level: 'ERROR', message: 'Failed to pull image: manifest unknown to registry', afterMinutes: 3 },
      { level: 'WARN', message: 'ImagePullBackOff: backing off 10s before retry', afterMinutes: 3 },
    ],
    incidentTitle: 'Image pull failure',
    incidentSummary: 'Container image could not be pulled from the registry. The image tag may not exist or the registry may be unreachable.',
  },
  ReadinessProbeTimeout: {
    messages: [
      { level: 'INFO', message: 'Starting application...', afterMinutes: 0 },
      { level: 'INFO', message: 'Connecting to dependencies...', afterMinutes: 1 },
      { level: 'INFO', message: 'Dependencies connected, starting HTTP server...', afterMinutes: 3 },
      { level: 'WARN', message: 'Readiness probe: GET /healthz — no response within 30s', afterMinutes: 5 },
      { level: 'WARN', message: 'Readiness probe failed (1/3)', afterMinutes: 5 },
      { level: 'WARN', message: 'Readiness probe: GET /healthz — no response within 30s', afterMinutes: 6 },
      { level: 'WARN', message: 'Readiness probe failed (2/3)', afterMinutes: 6 },
      { level: 'ERROR', message: 'Readiness probe failed 3/3 — container not ready', afterMinutes: 7 },
      { level: 'ERROR', message: 'Container killed: readiness probe timeout', afterMinutes: 7 },
    ],
    incidentTitle: 'Readiness probe timeout',
    incidentSummary: 'Container failed readiness probe checks. The application may be too slow to start or is blocking on an unresponsive dependency.',
  },
  CrashLoopBackOff: {
    messages: [
      { level: 'INFO', message: 'Starting application...', afterMinutes: 0 },
      { level: 'ERROR', message: 'Unhandled exception: ECONNREFUSED db.internal:5432', afterMinutes: 1 },
      { level: 'ERROR', message: 'Process exited with code 1', afterMinutes: 1 },
      { level: 'INFO', message: 'Container restarting (attempt 2)...', afterMinutes: 2 },
      { level: 'INFO', message: 'Starting application...', afterMinutes: 2 },
      { level: 'ERROR', message: 'Unhandled exception: ECONNREFUSED db.internal:5432', afterMinutes: 3 },
      { level: 'ERROR', message: 'Process exited with code 1', afterMinutes: 3 },
      { level: 'WARN', message: 'CrashLoopBackOff: waiting 10s before next restart', afterMinutes: 4 },
      { level: 'INFO', message: 'Container restarting (attempt 3)...', afterMinutes: 4 },
      { level: 'ERROR', message: 'Unhandled exception: ECONNREFUSED db.internal:5432', afterMinutes: 5 },
      { level: 'ERROR', message: 'CrashLoopBackOff: giving up after 3 consecutive failures', afterMinutes: 5 },
    ],
    incidentTitle: 'CrashLoopBackOff detected',
    incidentSummary: 'Container is repeatedly crashing on startup. A dependency may be unreachable or the application has a startup error.',
  },
};

@Injectable()
export class ObservabilityService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(METRICS_PROVIDER) private readonly metricsProvider: MetricsProvider,
    @Inject(LOGS_PROVIDER) private readonly logsProvider: LogsProvider,
  ) {}

  /**
   * Generate a batch of MetricSample rows correlated with rollout outcome.
   */
  async generateMetricsForRollout(
    deploymentId: string,
    rolloutId: string,
    status: RolloutStatus,
    failureScenario?: string,
  ): Promise<void> {
    const now = Date.now();
    const hours = 24;
    const samples: Array<{
      deploymentId: string;
      ts: Date;
      cpuPct: number;
      memMb: number;
      rps: number;
      p95Ms: number;
      errorRate: number;
    }> = [];

    for (let h = 0; h < hours; h++) {
      const ts = new Date(now - (hours - h) * 3600000);
      const hourOfDay = ts.getHours();
      const diurnal = Math.max(0, Math.sin((hourOfDay - 6) * Math.PI / 12));

      if (status === RolloutStatus.SUCCEEDED) {
        // Healthy baseline
        samples.push({
          deploymentId,
          ts,
          cpuPct: 15 + diurnal * 20 + this.deterministicNoise(rolloutId, h, 0) * 8,
          memMb: 200 + diurnal * 150 + this.deterministicNoise(rolloutId, h, 1) * 30,
          rps: 20 + diurnal * 60 + this.deterministicNoise(rolloutId, h, 2) * 10,
          p95Ms: 30 + diurnal * 30 + this.deterministicNoise(rolloutId, h, 3) * 15,
          errorRate: Math.max(0, 0.1 + this.deterministicNoise(rolloutId, h, 4) * 0.3),
        });
      } else {
        // Failed rollout — correlate with failure scenario
        samples.push(this.generateFailureMetric(deploymentId, ts, h, failureScenario, rolloutId));
      }
    }

    await this.prisma.metricSample.createMany({ data: samples });
  }

  private generateFailureMetric(
    deploymentId: string,
    ts: Date,
    hourIndex: number,
    scenario: string | undefined,
    seed: string,
  ) {
    const base = {
      deploymentId,
      ts,
      cpuPct: 10,
      memMb: 200,
      rps: 0,
      p95Ms: 0,
      errorRate: 0,
    };

    switch (scenario) {
      case 'OOMKilled': {
        // Rising memory until crash, then drop, then rise again
        const cycleHour = hourIndex % 12;
        const memRising = cycleHour < 10;
        return {
          ...base,
          cpuPct: memRising ? 30 + cycleHour * 5 : 5,
          memMb: memRising ? 500 + cycleHour * 180 : 100,
          rps: memRising ? 20 : 0,
          p95Ms: memRising ? 50 + cycleHour * 20 : 0,
          errorRate: memRising ? cycleHour * 1.5 : 15,
        };
      }
      case 'ReadinessProbeTimeout': {
        // Normal startup, then p95 spike and error burst
        const isFailing = hourIndex > 18;
        return {
          ...base,
          cpuPct: isFailing ? 5 : 20 + this.deterministicNoise(seed, hourIndex, 0) * 10,
          memMb: isFailing ? 150 : 300 + this.deterministicNoise(seed, hourIndex, 1) * 50,
          rps: isFailing ? 0 : 30 + this.deterministicNoise(seed, hourIndex, 2) * 20,
          p95Ms: isFailing ? 30000 : 40 + this.deterministicNoise(seed, hourIndex, 3) * 20,
          errorRate: isFailing ? 100 : 0.2,
        };
      }
      case 'CrashLoopBackOff': {
        // Sawtooth memory, periodic error spikes
        const sawtooth = hourIndex % 4;
        return {
          ...base,
          cpuPct: sawtooth < 2 ? 40 : 2,
          memMb: sawtooth < 2 ? 300 + sawtooth * 100 : 80,
          rps: sawtooth < 2 ? 15 : 0,
          p95Ms: sawtooth < 2 ? 60 : 0,
          errorRate: sawtooth < 2 ? 5 : 20,
        };
      }
      case 'ImagePullBackOff': {
        // Zero traffic, zero compute — container never started
        return {
          ...base,
          cpuPct: 0,
          memMb: 0,
          rps: 0,
          p95Ms: 0,
          errorRate: hourIndex > 16 ? 100 : 0,
        };
      }
      default: {
        return {
          ...base,
          cpuPct: 5 + this.deterministicNoise(seed, hourIndex, 0) * 5,
          memMb: 100 + this.deterministicNoise(seed, hourIndex, 1) * 30,
          rps: 0,
          p95Ms: 0,
          errorRate: 8 + this.deterministicNoise(seed, hourIndex, 4) * 5,
        };
      }
    }
  }

  /**
   * Generate LogEntry rows correlated with rollout outcome.
   */
  async generateLogsForRollout(
    deploymentId: string,
    rolloutId: string,
    status: RolloutStatus,
    failureScenario?: string,
  ): Promise<void> {
    const now = Date.now();
    const entries: Array<{
      deploymentId: string;
      ts: Date;
      level: LogLevel;
      message: string;
      meta: Prisma.InputJsonValue;
    }> = [];

    if (status === RolloutStatus.SUCCEEDED) {
      // Healthy startup + regular request logs
      const healthyMessages = [
        { level: 'INFO' as LogLevel, message: 'Starting application...', afterMinutes: 0 },
        { level: 'INFO' as LogLevel, message: 'Connected to database', afterMinutes: 1 },
        { level: 'INFO' as LogLevel, message: 'HTTP server listening on port 4000', afterMinutes: 2 },
        { level: 'INFO' as LogLevel, message: 'Readiness probe: /healthz — 200 OK', afterMinutes: 3 },
        { level: 'INFO' as LogLevel, message: 'Service ready to accept traffic', afterMinutes: 3 },
        { level: 'INFO' as LogLevel, message: 'GET /api/v1/status 200 — 8ms', afterMinutes: 10 },
        { level: 'INFO' as LogLevel, message: 'POST /api/v1/data 201 — 35ms', afterMinutes: 20 },
        { level: 'DEBUG' as LogLevel, message: 'Cache hit ratio: 94.2%', afterMinutes: 30 },
        { level: 'INFO' as LogLevel, message: 'Background job completed: session cleanup', afterMinutes: 45 },
        { level: 'INFO' as LogLevel, message: 'GET /healthz 200 — 1ms', afterMinutes: 60 },
      ];

      for (const msg of healthyMessages) {
        entries.push({
          deploymentId,
          ts: new Date(now - (120 - msg.afterMinutes) * 60000),
          level: msg.level,
          message: msg.message,
          meta: { rolloutId },
        });
      }
    } else if (failureScenario && FAILURE_PATTERNS[failureScenario]) {
      const pattern = FAILURE_PATTERNS[failureScenario];
      for (const msg of pattern.messages) {
        entries.push({
          deploymentId,
          ts: new Date(now - (120 - msg.afterMinutes) * 60000),
          level: msg.level,
          message: msg.message,
          meta: { rolloutId, scenario: failureScenario },
        });
      }
    } else {
      // Generic failure
      entries.push({
        deploymentId,
        ts: new Date(now - 120 * 60000),
        level: 'INFO',
        message: 'Starting application...',
        meta: { rolloutId },
      });
      entries.push({
        deploymentId,
        ts: new Date(now - 118 * 60000),
        level: 'ERROR',
        message: 'Application failed to start',
        meta: { rolloutId },
      });
    }

    await this.prisma.logEntry.createMany({ data: entries });
  }

  /**
   * Create an incident from a failed rollout.
   */
  async createIncident(
    workspaceId: string,
    deploymentId: string,
    rolloutId: string,
    failureScenario: string,
  ) {
    const pattern = FAILURE_PATTERNS[failureScenario];
    const title = pattern?.incidentTitle ?? `Deployment failure: ${failureScenario}`;
    const summary = pattern?.incidentSummary ?? `Deployment failed with scenario: ${failureScenario}`;

    const severityMap: Record<string, Severity> = {
      OOMKilled: Severity.HIGH,
      CrashLoopBackOff: Severity.CRITICAL,
      ReadinessProbeTimeout: Severity.MEDIUM,
      ImagePullBackOff: Severity.HIGH,
    };

    return this.prisma.incident.create({
      data: {
        workspaceId,
        deploymentId,
        title,
        severity: severityMap[failureScenario] ?? Severity.HIGH,
        status: IncidentStatus.OPEN,
        summary,
        startedAt: new Date(),
      },
    });
  }

  /**
   * Aggregate observability for a service (latest metrics + recent incidents).
   */
  async getForService(serviceId: string, workspaceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      select: { id: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    const deployments = await this.prisma.deployment.findMany({
      where: { serviceId },
      select: { id: true },
    });
    const deploymentIds = deployments.map((d) => d.id);

    // Latest metrics per deployment
    const latestMetrics = await this.prisma.metricSample.findMany({
      where: { deploymentId: { in: deploymentIds } },
      orderBy: { ts: 'desc' },
      take: 24,
    });

    // Recent incidents
    const incidents = await this.prisma.incident.findMany({
      where: { deploymentId: { in: deploymentIds } },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return { latestMetrics, incidents };
  }

  /**
   * Get metrics for a deployment with time range filtering.
   */
  async getMetrics(deploymentId: string, workspaceId: string, from: Date, to: Date, stepSeconds: number) {
    // Verify workspace ownership
    const deployment = await this.prisma.deployment.findFirst({
      where: { id: deploymentId, service: { workspaceId } },
      select: { id: true },
    });
    if (!deployment) throw new NotFoundException('Deployment not found');

    return this.prisma.metricSample.findMany({
      where: {
        deploymentId,
        ts: { gte: from, lte: to },
      },
      orderBy: { ts: 'asc' },
    });
  }

  /**
   * Get logs for a deployment with filtering.
   */
  async getLogs(deploymentId: string, workspaceId: string, query: LogsQueryInput) {
    const deployment = await this.prisma.deployment.findFirst({
      where: { id: deploymentId, service: { workspaceId } },
      select: { id: true },
    });
    if (!deployment) throw new NotFoundException('Deployment not found');

    const where: any = {
      deploymentId,
      ts: { gte: query.from, lte: query.to },
    };
    if (query.levels?.length) {
      where.level = { in: query.levels };
    }
    if (query.search) {
      where.message = { contains: query.search, mode: 'insensitive' };
    }

    return this.prisma.logEntry.findMany({
      where,
      orderBy: { ts: 'desc' },
      take: query.limit ?? 100,
    });
  }

  /**
   * List incidents in workspace.
   */
  async getIncidents(workspaceId: string) {
    return this.prisma.incident.findMany({
      where: { workspaceId },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Get single incident.
   */
  async getIncident(id: string, workspaceId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, workspaceId },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  /** Deterministic noise [0, 10) */
  private deterministicNoise(seed: string, index: number, salt: number): number {
    let hash = salt;
    for (let c = 0; c < seed.length; c++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(c)) | 0;
    }
    hash = ((hash << 5) - hash + index) | 0;
    return Math.abs(hash % 100) / 10;
  }
}
