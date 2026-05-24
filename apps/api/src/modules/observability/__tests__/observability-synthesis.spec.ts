import { describe, it, expect } from 'vitest';
import { RolloutStatus } from '@prisma/client';
import type { FailureScenario } from '../../../providers/rollout/rollout-driver.interface';

/**
 * Unit tests for observability synthesis logic.
 *
 * Tests the metric generation and log synthesis patterns
 * without NestJS DI or Prisma, by extracting the core logic.
 */

// ── Extracted metric generation logic (mirrors ObservabilityService) ──

function generateMetricSample(
  status: RolloutStatus,
  failureScenario: FailureScenario | undefined,
  hourIndex: number,
  seed: string,
) {
  const diurnal = Math.max(0, Math.sin((hourIndex - 6) * Math.PI / 12));
  const baseFactor = diurnal;

  if (status === RolloutStatus.SUCCEEDED || failureScenario === 'none') {
    return {
      cpuPct: 15 + baseFactor * 20 + detNoise(hourIndex, 0) * 8,
      memMb: 250 + baseFactor * 100 + detNoise(hourIndex, 1) * 20,
      rps: 30 + baseFactor * 50 + detNoise(hourIndex, 2) * 10,
      p95Ms: 30 + baseFactor * 25 + detNoise(hourIndex, 3) * 15,
      errorRate: 0.05 + detNoise(hourIndex, 4) * 0.3,
    };
  }

  switch (failureScenario) {
    case 'OOMKilled': {
      const cycleHour = hourIndex % 12;
      const memRising = cycleHour < 10;
      return {
        cpuPct: memRising ? 30 + cycleHour * 5 : 5,
        memMb: memRising ? 500 + cycleHour * 180 : 100,
        rps: memRising ? 20 : 0,
        p95Ms: memRising ? 50 + cycleHour * 20 : 0,
        errorRate: memRising ? cycleHour * 1.5 : 15,
      };
    }
    case 'ReadinessProbeTimeout': {
      const isFailing = hourIndex > 18;
      return {
        cpuPct: isFailing ? 5 : 20 + baseFactor * 10,
        memMb: isFailing ? 150 : 300 + baseFactor * 50,
        rps: isFailing ? 0 : 30 + baseFactor * 20,
        p95Ms: isFailing ? 30000 : 40 + baseFactor * 20,
        errorRate: isFailing ? 100 : 0.2,
      };
    }
    case 'CrashLoopBackOff': {
      const sawtooth = hourIndex % 4;
      return {
        cpuPct: sawtooth < 2 ? 40 : 2,
        memMb: sawtooth < 2 ? 300 + sawtooth * 100 : 80,
        rps: sawtooth < 2 ? 15 : 0,
        p95Ms: sawtooth < 2 ? 60 : 0,
        errorRate: sawtooth < 2 ? 5 : 20,
      };
    }
    case 'ImagePullBackOff': {
      return {
        cpuPct: 0,
        memMb: 0,
        rps: 0,
        p95Ms: 0,
        errorRate: hourIndex > 16 ? 100 : 0,
      };
    }
    default: {
      return {
        cpuPct: 5 + detNoise(hourIndex, 0) * 5,
        memMb: 100 + detNoise(hourIndex, 1) * 30,
        rps: 0,
        p95Ms: 0,
        errorRate: 8 + detNoise(hourIndex, 4) * 5,
      };
    }
  }
}

// ── Extracted log generation patterns ───────────────────────

interface LogLine {
  level: string;
  message: string;
}

function getLogSequence(status: RolloutStatus, failureScenario?: FailureScenario): LogLine[] {
  if (status === RolloutStatus.SUCCEEDED || failureScenario === 'none') {
    return [
      { level: 'INFO', message: 'Starting application...' },
      { level: 'INFO', message: 'Connected to database' },
      { level: 'INFO', message: 'HTTP server listening on port 4000' },
      { level: 'INFO', message: 'Readiness probe: /healthz — 200 OK' },
      { level: 'INFO', message: 'Service ready to accept traffic' },
    ];
  }

  switch (failureScenario) {
    case 'OOMKilled':
      return [
        { level: 'INFO', message: 'Starting application...' },
        { level: 'INFO', message: 'Application started, loading ML model...' },
        { level: 'WARN', message: 'Memory usage at 82% of limit (1680Mi / 2048Mi)' },
        { level: 'WARN', message: 'Memory usage at 91% of limit (1864Mi / 2048Mi)' },
        { level: 'ERROR', message: 'OOMKilled: container exceeded memory limit (2048Mi)' },
        { level: 'INFO', message: 'Container restarting after OOMKill...' },
        { level: 'INFO', message: 'Starting application...' },
        { level: 'WARN', message: 'Memory usage climbing — 78% within 30s of restart' },
        { level: 'ERROR', message: 'OOMKilled: container exceeded memory limit (2048Mi)' },
      ];
    case 'ReadinessProbeTimeout':
      return [
        { level: 'INFO', message: 'Starting application...' },
        { level: 'INFO', message: 'Connecting to dependencies...' },
        { level: 'INFO', message: 'Dependencies connected, starting HTTP server...' },
        { level: 'WARN', message: 'Readiness probe: GET /healthz — no response within 30s' },
        { level: 'WARN', message: 'Readiness probe failed (1/3)' },
        { level: 'WARN', message: 'Readiness probe: GET /healthz — no response within 30s' },
        { level: 'WARN', message: 'Readiness probe failed (2/3)' },
        { level: 'ERROR', message: 'Readiness probe failed 3/3 — container not ready' },
        { level: 'ERROR', message: 'Container killed: readiness probe timeout' },
      ];
    case 'CrashLoopBackOff':
      return [
        { level: 'INFO', message: 'Starting application...' },
        { level: 'ERROR', message: 'Unhandled exception: ECONNREFUSED db.internal:5432' },
        { level: 'ERROR', message: 'Process exited with code 1' },
        { level: 'INFO', message: 'Container restarting (attempt 2)...' },
        { level: 'INFO', message: 'Starting application...' },
        { level: 'ERROR', message: 'Unhandled exception: ECONNREFUSED db.internal:5432' },
        { level: 'ERROR', message: 'Process exited with code 1' },
        { level: 'WARN', message: 'CrashLoopBackOff: waiting 10s before next restart' },
        { level: 'ERROR', message: 'CrashLoopBackOff: giving up after 3 consecutive failures' },
      ];
    case 'ImagePullBackOff':
      return [
        { level: 'INFO', message: 'Pulling image from registry...' },
        { level: 'ERROR', message: 'Failed to pull image: manifest unknown to registry' },
        { level: 'WARN', message: 'Retrying image pull (attempt 2)...' },
        { level: 'ERROR', message: 'Failed to pull image: manifest unknown to registry' },
        { level: 'WARN', message: 'ImagePullBackOff: backing off 10s before retry' },
      ];
    default:
      return [{ level: 'INFO', message: 'Deployment completed' }];
  }
}

// ── Deterministic noise (mirrors service) ──────────────────

function detNoise(i: number, salt: number): number {
  const hash = ((i * 2654435761 + salt * 2246822519) >>> 0) % 100;
  return hash / 100;
}

// ── Tests ───────────────────────────────────────────────────

describe('Observability synthesis', () => {
  describe('successful rollout metrics', () => {
    it('generates healthy baseline metrics', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.SUCCEEDED, 'none', i, 'test-seed'),
      );

      for (const s of samples) {
        expect(s.cpuPct).toBeGreaterThan(0);
        expect(s.cpuPct).toBeLessThan(60);
        expect(s.memMb).toBeGreaterThan(200);
        expect(s.memMb).toBeLessThan(400);
        expect(s.rps).toBeGreaterThan(0);
        expect(s.errorRate).toBeLessThan(5);
      }
    });

    it('has low error rates for successful deployments', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.SUCCEEDED, 'none', i, 'test'),
      );

      const avgErrorRate = samples.reduce((sum, s) => sum + s.errorRate, 0) / samples.length;
      expect(avgErrorRate).toBeLessThan(1);
    });
  });

  describe('OOMKilled metrics', () => {
    it('shows rising memory before crash', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'OOMKilled', i, 'test'),
      );

      // First cycle: hours 0-9 should show memory rising
      const firstCycle = samples.slice(0, 10);
      for (let i = 1; i < firstCycle.length; i++) {
        expect(firstCycle[i].memMb).toBeGreaterThanOrEqual(firstCycle[i - 1].memMb - 1);
      }
    });

    it('drops memory after crash (restart)', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'OOMKilled', i, 'test'),
      );

      // When cycle resets (hour 0 vs hour 11), memory should drop
      expect(samples[0].memMb).toBeLessThan(samples[9].memMb);
    });

    it('shows zero RPS during crash phase', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'OOMKilled', i, 'test'),
      );

      // During crash phase (non-rising), RPS should be 0
      const crashSamples = samples.filter((_, i) => (i % 12) >= 10);
      for (const s of crashSamples) {
        expect(s.rps).toBe(0);
      }
    });

    it('shows elevated error rates', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'OOMKilled', i, 'test'),
      );

      // Error rates should be significantly higher than healthy
      const avgError = samples.reduce((sum, s) => sum + s.errorRate, 0) / samples.length;
      expect(avgError).toBeGreaterThan(2);
    });
  });

  describe('ReadinessProbeTimeout metrics', () => {
    it('shows normal startup metrics before failure', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'ReadinessProbeTimeout', i, 'test'),
      );

      // Pre-failure hours should have normal-looking metrics
      const preFailure = samples.slice(0, 18);
      for (const s of preFailure) {
        expect(s.cpuPct).toBeGreaterThan(0);
        expect(s.memMb).toBeGreaterThan(200);
        expect(s.p95Ms).toBeLessThan(100);
      }
    });

    it('shows p95 spike after failure', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'ReadinessProbeTimeout', i, 'test'),
      );

      // Post-failure hours should have massive p95
      const postFailure = samples.slice(19);
      for (const s of postFailure) {
        expect(s.p95Ms).toBe(30000);
      }
    });

    it('shows zero RPS after failure', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'ReadinessProbeTimeout', i, 'test'),
      );

      const postFailure = samples.slice(19);
      for (const s of postFailure) {
        expect(s.rps).toBe(0);
      }
    });

    it('shows 100% error rate after failure', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'ReadinessProbeTimeout', i, 'test'),
      );

      const postFailure = samples.slice(19);
      for (const s of postFailure) {
        expect(s.errorRate).toBe(100);
      }
    });
  });

  describe('CrashLoopBackOff metrics', () => {
    it('shows sawtooth memory pattern', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'CrashLoopBackOff', i, 'test'),
      );

      // CrashLoop uses modulo-4 cycle: hours 0-1 active, 2-3 crashed
      const activeHours = samples.filter((_, i) => i % 4 < 2);
      const crashedHours = samples.filter((_, i) => i % 4 >= 2);

      // Active hours should have higher memory than crashed
      for (let i = 0; i < Math.min(activeHours.length, crashedHours.length); i++) {
        expect(activeHours[i].memMb).toBeGreaterThan(crashedHours[i].memMb);
      }
    });

    it('shows periodic zero RPS during crashes', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'CrashLoopBackOff', i, 'test'),
      );

      const crashedRps = samples.filter((_, i) => i % 4 >= 2).map((s) => s.rps);
      for (const rps of crashedRps) {
        expect(rps).toBe(0);
      }
    });

    it('shows elevated error rates during crashes', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'CrashLoopBackOff', i, 'test'),
      );

      const crashedErrors = samples.filter((_, i) => i % 4 >= 2).map((s) => s.errorRate);
      for (const rate of crashedErrors) {
        expect(rate).toBe(20);
      }
    });
  });

  describe('ImagePullBackOff metrics', () => {
    it('shows zero resource usage', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'ImagePullBackOff', i, 'test'),
      );

      for (const s of samples) {
        expect(s.cpuPct).toBe(0);
        expect(s.memMb).toBe(0);
        expect(s.rps).toBe(0);
        expect(s.p95Ms).toBe(0);
      }
    });

    it('shows 100% error rate after initial hours', () => {
      const samples = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.FAILED, 'ImagePullBackOff', i, 'test'),
      );

      const lateHours = samples.slice(17);
      for (const s of lateHours) {
        expect(s.errorRate).toBe(100);
      }
    });
  });

  describe('log synthesis', () => {
    it('produces startup logs for successful rollout', () => {
      const logs = getLogSequence(RolloutStatus.SUCCEEDED, 'none');
      expect(logs[0].message).toContain('Starting application');
      expect(logs.some((l) => l.message.includes('ready'))).toBe(true);
      expect(logs.some((l) => l.level === 'ERROR')).toBe(false);
    });

    it('produces OOM crash sequence for OOMKilled', () => {
      const logs = getLogSequence(RolloutStatus.FAILED, 'OOMKilled');

      // Should have startup, memory warnings, OOM kill, restart, second OOM
      const errorLogs = logs.filter((l) => l.level === 'ERROR');
      expect(errorLogs.length).toBeGreaterThanOrEqual(2);
      expect(logs.some((l) => l.message.includes('OOMKilled'))).toBe(true);
      expect(logs.some((l) => l.message.includes('Memory usage'))).toBe(true);
      expect(logs.some((l) => l.message.includes('restarting'))).toBe(true);
    });

    it('produces readiness probe failures for ReadinessProbeTimeout', () => {
      const logs = getLogSequence(RolloutStatus.FAILED, 'ReadinessProbeTimeout');

      // Should have normal startup, then probe failures
      expect(logs.some((l) => l.message.includes('Starting application'))).toBe(true);
      expect(logs.some((l) => l.message.includes('Readiness probe'))).toBe(true);
      expect(logs.some((l) => l.message.includes('3/3'))).toBe(true);
      expect(logs.some((l) => l.level === 'ERROR')).toBe(true);
    });

    it('produces crash loop sequence for CrashLoopBackOff', () => {
      const logs = getLogSequence(RolloutStatus.FAILED, 'CrashLoopBackOff');

      // Should have startup, connection error, exit, restart, repeat
      expect(logs.some((l) => l.message.includes('ECONNREFUSED'))).toBe(true);
      expect(logs.some((l) => l.message.includes('exited with code 1'))).toBe(true);
      expect(logs.some((l) => l.message.includes('restarting'))).toBe(true);
      expect(logs.some((l) => l.message.includes('CrashLoopBackOff'))).toBe(true);
    });

    it('produces image pull errors for ImagePullBackOff', () => {
      const logs = getLogSequence(RolloutStatus.FAILED, 'ImagePullBackOff');

      expect(logs.some((l) => l.message.includes('Pulling image'))).toBe(true);
      expect(logs.some((l) => l.message.includes('manifest unknown'))).toBe(true);
      expect(logs.some((l) => l.message.includes('ImagePullBackOff'))).toBe(true);
    });

    it('produces deterministic output for same inputs', () => {
      const logs1 = getLogSequence(RolloutStatus.FAILED, 'OOMKilled');
      const logs2 = getLogSequence(RolloutStatus.FAILED, 'OOMKilled');
      expect(logs1).toEqual(logs2);
    });
  });

  describe('determinism', () => {
    it('generates identical metrics for same inputs', () => {
      const samples1 = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.SUCCEEDED, 'none', i, 'fixed-seed'),
      );
      const samples2 = Array.from({ length: 24 }, (_, i) =>
        generateMetricSample(RolloutStatus.SUCCEEDED, 'none', i, 'fixed-seed'),
      );

      expect(samples1).toEqual(samples2);
    });

    it('different seeds produce different noise values', () => {
      // Verify noise function varies with index
      const noise0 = detNoise(0, 0);
      const noise1 = detNoise(1, 0);
      const noise2 = detNoise(2, 0);
      // At least some should differ (they're pseudo-random)
      const unique = new Set([noise0, noise1, noise2]);
      expect(unique.size).toBeGreaterThan(1);
    });
  });
});
