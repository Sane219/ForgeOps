export interface MetricsRange {
  deploymentId: string;
  from: Date;
  to: Date;
  stepSeconds: number;
}

export interface MetricSamplePoint {
  ts: Date;
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

export const METRICS_PROVIDER = Symbol('METRICS_PROVIDER');

export interface MetricsProvider {
  query(range: MetricsRange): Promise<MetricsSeries>;
}
