import { Injectable } from '@nestjs/common';
import type {
  LogPage,
  LogQuery,
  LogsProvider,
  LogEntry,
  LogLevel,
} from './logs-provider.interface';

const HEALTHY_MESSAGES: Array<{ level: LogLevel; message: string }> = [
  { level: 'INFO', message: 'GET /healthz 200 — 2ms' },
  { level: 'INFO', message: 'GET /api/v1/status 200 — 12ms' },
  { level: 'INFO', message: 'POST /api/v1/data 201 — 45ms' },
  { level: 'DEBUG', message: 'Cache hit for key: user:session:abc123' },
  { level: 'INFO', message: 'Worker heartbeat OK' },
  { level: 'INFO', message: 'GET /api/v1/items 200 — 18ms' },
  { level: 'DEBUG', message: 'Connection pool: 8/20 active' },
  { level: 'INFO', message: 'Background job completed: cleanup stale sessions' },
];

const OOM_MESSAGES: Array<{ level: LogLevel; message: string }> = [
  { level: 'WARN', message: 'Memory usage at 85% of limit (1740Mi / 2048Mi)' },
  { level: 'WARN', message: 'Memory usage at 92% of limit (1884Mi / 2048Mi)' },
  { level: 'ERROR', message: 'OOMKilled: container memory limit exceeded (2048Mi)' },
  { level: 'INFO', message: 'Container restarting after OOMKill...' },
  { level: 'INFO', message: 'Starting application...' },
  { level: 'INFO', message: 'Application started successfully' },
  { level: 'WARN', message: 'Memory usage climbing rapidly — 78% within 30s of restart' },
  { level: 'ERROR', message: 'OOMKilled: container memory limit exceeded (2048Mi)' },
];

const READINESS_TIMEOUT_MESSAGES: Array<{ level: LogLevel; message: string }> = [
  { level: 'INFO', message: 'Starting application...' },
  { level: 'INFO', message: 'Loading ML model from /models/classifier-v2.onnx...' },
  { level: 'INFO', message: 'Model loaded in 8.2s' },
  { level: 'INFO', message: 'Listening on port 8000' },
  { level: 'WARN', message: 'Readiness probe: GET /healthz — timeout after 30s' },
  { level: 'ERROR', message: 'Readiness probe failed 3/3 — marking container not ready' },
  { level: 'ERROR', message: 'Container killed: readiness probe timeout' },
];

const CRASH_LOOP_MESSAGES: Array<{ level: LogLevel; message: string }> = [
  { level: 'INFO', message: 'Starting application...' },
  { level: 'INFO', message: 'Connecting to database...' },
  { level: 'ERROR', message: 'Unhandled exception in main: ECONNREFUSED 10.0.0.5:5432' },
  { level: 'ERROR', message: 'Process exited with code 1' },
  { level: 'INFO', message: 'Container restarting (attempt 2/5)...' },
  { level: 'INFO', message: 'Starting application...' },
  { level: 'ERROR', message: 'Unhandled exception in main: ECONNREFUSED 10.0.0.5:5432' },
  { level: 'ERROR', message: 'Process exited with code 1' },
  { level: 'WARN', message: 'CrashLoopBackOff: waiting 10s before restart' },
];

const IMAGE_PULL_MESSAGES: Array<{ level: LogLevel; message: string }> = [
  { level: 'INFO', message: 'Pulling image ghcr.io/acme/service:latest...' },
  { level: 'ERROR', message: 'Failed to pull image: manifest unknown' },
  { level: 'ERROR', message: 'ImagePullBackOff: back-off 10s pulling image' },
  { level: 'WARN', message: 'Retrying image pull (attempt 3)...' },
  { level: 'ERROR', message: 'Failed to pull image: manifest unknown' },
];

@Injectable()
export class MockLogsProvider implements LogsProvider {
  async query(q: LogQuery): Promise<LogPage> {
    // Use deploymentId to deterministically pick a log pattern
    const hash = this.simpleHash(q.deploymentId);
    const pattern = hash % 5; // 0 = healthy, 1-4 = various failures

    const messages = this.getMessagesForPattern(pattern);
    const entries: LogEntry[] = [];
    const limit = q.limit ?? 100;
    const stepMs = 60000; // 1 log per minute

    const fromTime = q.from.getTime();
    const toTime = q.to.getTime();
    const totalMinutes = Math.floor((toTime - fromTime) / stepMs);
    const count = Math.min(totalMinutes, limit);

    for (let i = 0; i < count; i++) {
      const msg = messages[i % messages.length];
      if (!msg) continue;
      if (q.levels && !q.levels.includes(msg.level)) continue;
      if (q.search && !msg.message.toLowerCase().includes(q.search.toLowerCase())) continue;

      entries.push({
        ts: new Date(fromTime + i * stepMs),
        level: msg.level,
        message: msg.message,
        meta: { deploymentId: q.deploymentId },
      });
    }

    return { entries };
  }

  private getMessagesForPattern(pattern: number) {
    switch (pattern) {
      case 1: return OOM_MESSAGES;
      case 2: return READINESS_TIMEOUT_MESSAGES;
      case 3: return CRASH_LOOP_MESSAGES;
      case 4: return IMAGE_PULL_MESSAGES;
      default: return HEALTHY_MESSAGES;
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
