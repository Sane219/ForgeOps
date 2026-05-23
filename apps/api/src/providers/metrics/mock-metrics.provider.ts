import { Injectable } from '@nestjs/common';
import type {
  MetricsProvider,
  MetricsRange,
  MetricsSeries,
} from './metrics-provider.interface';

/**
 * Day-5 deliverable: produces a synthetic time series with diurnal CPU/RPS
 * patterns, occasional p95 spikes, and error-rate jumps correlated with
 * known failed rollouts seeded in the demo data. Day-1 skeleton: empty
 * series.
 */
@Injectable()
export class MockMetricsProvider implements MetricsProvider {
  async query(range: MetricsRange): Promise<MetricsSeries> {
    return {
      deploymentId: range.deploymentId,
      stepSeconds: range.stepSeconds,
      samples: [],
    };
  }
}
