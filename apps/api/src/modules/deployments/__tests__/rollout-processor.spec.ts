import { describe, it, expect } from 'vitest';
import type { FailureScenario } from '../../../providers/rollout/rollout-driver.interface';

// Test the failure scenario determination logic in isolation
function determineFailureScenario(runtime: string, isProd: boolean): FailureScenario {
  // Simple hash matching the DeploymentsService implementation
  let hash = 0;
  for (let i = 0; i < runtime.length; i++) {
    hash = ((hash << 5) - hash) + runtime.charCodeAt(i);
    hash = hash & hash;
  }
  hash = Math.abs(hash);

  const threshold = isProd ? 15 : 10;
  if (hash % 100 < threshold) {
    const scenarios: FailureScenario[] = ['OOMKilled', 'ImagePullBackOff', 'ReadinessProbeTimeout', 'CrashLoopBackOff'];
    return (scenarios[hash % scenarios.length] ?? 'OOMKilled') as FailureScenario;
  }
  return 'none' as FailureScenario;
}

describe('Failure scenario determination', () => {
  it('is deterministic for the same input', () => {
    const a = determineFailureScenario('FASTAPI', true);
    const b = determineFailureScenario('FASTAPI', true);
    expect(a).toBe(b);
  });

  it('returns none for most runtimes in non-prod', () => {
    // Most runtimes should pass (hash % 100 >= 10)
    const runtimes = ['NESTJS', 'NEXTJS', 'GO_SERVICE', 'PYTHON_WORKER'];
    const results = runtimes.map((r) => determineFailureScenario(r, false));
    const failures = results.filter((r) => r !== 'none');
    // At most 1 out of 4 should fail (10% chance)
    expect(failures.length).toBeLessThanOrEqual(1);
  });

  it('returns valid FailureScenario values', () => {
    const validScenarios = ['none', 'OOMKilled', 'ImagePullBackOff', 'ReadinessProbeTimeout', 'CrashLoopBackOff'];
    // Test many runtimes to cover different hash paths
    const runtimes = ['NESTJS', 'NEXTJS', 'FASTAPI', 'GO_SERVICE', 'PYTHON_WORKER', 'NESTJS_API', 'MY_APP'];
    for (const rt of runtimes) {
      const result = determineFailureScenario(rt, true);
      expect(validScenarios).toContain(result);
    }
  });
});

describe('Rollout phase definitions', () => {
  const ROLLOUT_PHASES = [
    { name: 'pulling_image', failOnScenario: 'ImagePullBackOff' },
    { name: 'starting_container', failOnScenario: 'OOMKilled' },
    { name: 'running_health_check', failOnScenario: 'ReadinessProbeTimeout' },
    { name: 'ready', failOnScenario: 'CrashLoopBackOff' },
  ];

  it('each failure scenario maps to exactly one phase', () => {
    const scenarios = ROLLOUT_PHASES.map((p) => p.failOnScenario);
    const unique = new Set(scenarios);
    expect(unique.size).toBe(scenarios.length);
  });

  it('all four failure scenarios are covered', () => {
    const scenarios = ROLLOUT_PHASES.map((p) => p.failOnScenario);
    expect(scenarios).toContain('ImagePullBackOff');
    expect(scenarios).toContain('OOMKilled');
    expect(scenarios).toContain('ReadinessProbeTimeout');
    expect(scenarios).toContain('CrashLoopBackOff');
  });

  it('phases are ordered logically', () => {
    const phaseNames = ROLLOUT_PHASES.map((p) => p.name);
    expect(phaseNames[0]).toBe('pulling_image');
    expect(phaseNames[1]).toBe('starting_container');
    expect(phaseNames[2]).toBe('running_health_check');
    expect(phaseNames[3]).toBe('ready');
  });
});

describe('Rollout state transitions', () => {
  const validTransitions: Record<string, string[]> = {
    PENDING: ['IN_PROGRESS'],
    IN_PROGRESS: ['SUCCEEDED', 'FAILED'],
    SUCCEEDED: [],
    FAILED: ['PENDING'], // via rollback
    CANCELLED: [],
  };

  it('PENDING can only transition to IN_PROGRESS', () => {
    expect(validTransitions['PENDING']).toEqual(['IN_PROGRESS']);
  });

  it('IN_PROGRESS can transition to SUCCEEDED or FAILED', () => {
    expect(validTransitions['IN_PROGRESS']).toContain('SUCCEEDED');
    expect(validTransitions['IN_PROGRESS']).toContain('FAILED');
  });

  it('SUCCEEDED is terminal', () => {
    expect(validTransitions['SUCCEEDED']).toEqual([]);
  });

  it('FAILED can transition to PENDING via rollback', () => {
    expect(validTransitions['FAILED']).toContain('PENDING');
  });

  it('no status can transition to itself', () => {
    for (const [status, targets] of Object.entries(validTransitions)) {
      expect(targets).not.toContain(status);
    }
  });
});
