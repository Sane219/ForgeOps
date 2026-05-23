import { z } from 'zod';
import { IncidentStatus, Severity } from './enums';

export const metricsRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  stepSeconds: z.coerce.number().int().min(15).max(3600).default(60),
});
export type MetricsRangeInput = z.infer<typeof metricsRangeSchema>;

export interface MetricSamplePoint {
  ts: string;
  cpuPct: number;
  memMb: number;
  rps: number;
  p95Ms: number;
  errorRate: number;
}

export interface MetricsSeries {
  deploymentId: string;
  stepSeconds: number;
  samples: MetricSamplePoint[];
}

export const logLevelEnum = z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']);
export type LogLevel = z.infer<typeof logLevelEnum>;

export const logsQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  levels: z.array(logLevelEnum).optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: z.string().optional(),
});
export type LogsQueryInput = z.infer<typeof logsQuerySchema>;

export interface LogEntrySummary {
  id: string;
  ts: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

export interface IncidentSummary {
  id: string;
  workspaceId: string;
  deploymentId: string | null;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  summary: string | null;
  startedAt: string;
  resolvedAt: string | null;
}
