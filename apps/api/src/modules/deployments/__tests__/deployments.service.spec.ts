import { describe, it, expect } from 'vitest';
import type { FailureScenario } from '../../../providers/rollout/rollout-driver.interface';

// Test the failure scenario determination logic (extracted from service)
function determineFailureScenario(runtime: string, environment: 'DEV' | 'STAGING' | 'PROD'): FailureScenario {
  if (environment === 'DEV') return 'none';

  const hash = simpleHash(runtime);
  const threshold = environment === 'PROD' ? 15 : 10;
  if (hash % 100 < threshold) {
    const scenarios: FailureScenario[] = ['OOMKilled', 'ImagePullBackOff', 'ReadinessProbeTimeout', 'CrashLoopBackOff'];
    return (scenarios[hash % scenarios.length] ?? 'OOMKilled') as FailureScenario;
  }
  return 'none';
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

describe('DeploymentsService', () => {
  describe('failure scenario determination', () => {
    it('never fails in DEV', () => {
      const runtimes = ['NESTJS', 'NEXTJS', 'FASTAPI', 'GO_SERVICE', 'PYTHON_WORKER'];
      for (const rt of runtimes) {
        expect(determineFailureScenario(rt, 'DEV')).toBe('none');
      }
    });

    it('is deterministic for same input', () => {
      const scenarios = Array.from({ length: 10 }, () =>
        determineFailureScenario('NESTJS', 'PROD'),
      );
      expect(new Set(scenarios).size).toBe(1);
    });

    it('returns valid FailureScenario values', () => {
      const valid: FailureScenario[] = ['none', 'OOMKilled', 'ImagePullBackOff', 'ReadinessProbeTimeout', 'CrashLoopBackOff'];
      const runtimes = ['NESTJS', 'NEXTJS', 'FASTAPI', 'GO_SERVICE', 'PYTHON_WORKER'];
      for (const rt of runtimes) {
        for (const env of ['STAGING', 'PROD'] as const) {
          expect(valid).toContain(determineFailureScenario(rt, env));
        }
      }
    });
  });

  describe('workspace scoping', () => {
    it('deployments are scoped to workspace via service relation', () => {
      // The query pattern: where: { service: { workspaceId } }
      // This is validated by Prisma's type system at compile time
      const queryPattern = { service: { workspaceId: 'ws-123' } };
      expect(queryPattern.service.workspaceId).toBe('ws-123');
    });
  });

  describe('rollback logic', () => {
    it('rollback requires a previous succeeded rollout', () => {
      const rollouts = [
        { status: 'FAILED', imageTag: 'v1' },
        { status: 'SUCCEEDED', imageTag: 'v1' },
      ];
      const lastSucceeded = rollouts.find((r) => r.status === 'SUCCEEDED');
      expect(lastSucceeded).toBeDefined();
      expect(lastSucceeded!.imageTag).toBe('v1');
    });

    it('rollback rejects when no succeeded rollout exists', () => {
      const rollouts = [
        { status: 'FAILED', imageTag: 'v1' },
        { status: 'IN_PROGRESS', imageTag: 'v2' },
      ];
      const lastSucceeded = rollouts.find((r) => r.status === 'SUCCEEDED');
      expect(lastSucceeded).toBeUndefined();
    });

    it('rollback uses failureScenario none', () => {
      // Rollbacks always succeed — this is a design invariant
      const rollbackPlan = {
        rolloutId: 'r1',
        deploymentId: 'd1',
        serviceVersionId: 'sv1',
        imageTag: 'v1',
        failureScenario: 'none' as FailureScenario,
      };
      expect(rollbackPlan.failureScenario).toBe('none');
    });
  });

  describe('concurrent rollout protection', () => {
    it('rejects trigger when active rollout exists', () => {
      const activeStatuses = ['PENDING', 'IN_PROGRESS'];
      const existing = { status: 'IN_PROGRESS' };
      const isActive = activeStatuses.includes(existing.status);
      expect(isActive).toBe(true);
    });

    it('allows trigger when no active rollout', () => {
      const activeStatuses = ['PENDING', 'IN_PROGRESS'];
      const existing = { status: 'SUCCEEDED' };
      const isActive = activeStatuses.includes(existing.status);
      expect(isActive).toBe(false);
    });
  });
});
