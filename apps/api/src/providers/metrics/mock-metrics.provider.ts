import { Injectable } from '@nestjs/common';
import type {
  MetricsProvider,
  MetricsRange,
  MetricsSeries,
  MetricSamplePoint,
} from './metrics-provider.interface';

/**
 * Day-5 deliverable: produces a synthetic time series with diurnal CPU/RPS
 * patterns, occasional p95 spikes, and error-rate jumps.
 */
@Injectable()
export class MockMetricsProvider implements MetricsProvider {
  async query(range: MetricsRange): Promise<MetricsSeries> {
    const { deploymentId, from, to, stepSeconds } = range;
    const samples: MetricSamplePoint[] = [];

    const stepMs = stepSeconds * 1000;
    const totalMs = to.getTime() - from.getTime();
    const count = Math.min(Math.floor(totalMs / stepMs), 1000);

    for (let i = 0; i < count; i++) {
      const ts = new Date(from.getTime() + i * stepMs);
      const hour = ts.getHours() + ts.getMinutes() / 60;

      // Diurnal pattern — peak during business hours
      const diurnal = Math.sin((hour - 6) * Math.PI / 12);
      const diurnalFactor = Math.max(0, diurnal);

      samples.push({
        ts,
        cpuPct: 15 + diurnalFactor * 20 + this.pseudoRandom(deploymentId, i, 0) * 8,
        memMb: 200 + diurnalFactor * 150 + this.pseudoRandom(deploymentId, i, 1) * 30,
        rps: 20 + diurnalFactor * 60 + this.pseudoRandom(deploymentId, i, 2) * 10,
        p95Ms: 30 + diurnalFactor * 30 + this.pseudoRandom(deploymentId, i, 3) * 15,
        errorRate: Math.max(0, 0.1 + this.pseudoRandom(deploymentId, i, 4) * 0.4),
      });
    }

    return { deploymentId, stepSeconds, samples };
  }

  /** Deterministic pseudo-random [0, 10) based on deploymentId + index */
  private pseudoRandom(id: string, i: number, salt: number): number {
    let hash = salt;
    for (let c = 0; c < id.length; c++) {
      hash = ((hash << 5) - hash + id.charCodeAt(c)) | 0;
    }
    hash = ((hash << 5) - hash + i) | 0;
    return Math.abs(hash % 100) / 10;
  }
}
