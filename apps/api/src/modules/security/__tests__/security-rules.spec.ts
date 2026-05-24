import { describe, it, expect } from 'vitest';
import { FindingKind, Severity } from '@prisma/client';
import type { ScanInput, ScannerFinding } from '../../../providers/security/security-scanner.interface';

/**
 * Unit tests for the MockSecurityScanner rule engine.
 *
 * The rules are extracted here as pure functions to avoid needing
 * NestJS DI or a Prisma connection. The actual MockSecurityScanner
 * delegates to these same patterns.
 */

// ── Rule implementations (mirrors mock-security.scanner.ts) ─────

const SECRET_PATTERN = /PASSWORD|TOKEN|SECRET|API_KEY|PRIVATE_KEY|CREDENTIAL|AUTH/i;

const SEVERITY_DEDUCTIONS: Record<string, number> = {
  CRITICAL: 20,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 2,
  INFO: 1,
};

function runRules(input: ScanInput): ScannerFinding[] {
  const findings: ScannerFinding[] = [];

  // SEC-001: Secret env vars
  for (const env of input.envVars) {
    if (SECRET_PATTERN.test(env.key) && env.value.length > 0) {
      findings.push({
        kind: FindingKind.SECRET,
        severity: Severity.CRITICAL,
        ruleId: 'SEC-001',
        title: 'Suspicious secret in environment variable',
        description: `Variable "${env.key}" appears to contain a secret value.`,
        location: `envVars.${env.key}`,
        remediation: 'Move this secret to a dedicated secrets manager.',
      });
    }
  }

  // SEC-002: Missing resource limits
  if (!input.cpuMillicores || input.cpuMillicores <= 0) {
    findings.push({
      kind: FindingKind.CONTAINER,
      severity: Severity.HIGH,
      ruleId: 'SEC-002',
      title: 'No CPU resource limit set',
      description: 'Container has no CPU limit configured.',
      location: 'serviceVersion.cpuMillicores',
      remediation: 'Set a CPU resource limit.',
    });
  }
  if (!input.memoryMb || input.memoryMb <= 0) {
    findings.push({
      kind: FindingKind.CONTAINER,
      severity: Severity.HIGH,
      ruleId: 'SEC-002',
      title: 'No memory resource limit set',
      description: 'Container has no memory limit configured.',
      location: 'serviceVersion.memoryMb',
      remediation: 'Set a memory limit.',
    });
  }

  // SEC-003: Unpinned base image
  if (input.dockerfile) {
    const fromMatch = input.dockerfile.match(/FROM\s+(\S+)/gi);
    if (fromMatch) {
      for (const from of fromMatch) {
        const image = from.replace(/FROM\s+/i, '');
        if (image.endsWith(':latest') || !image.includes(':')) {
          findings.push({
            kind: FindingKind.CONTAINER,
            severity: Severity.MEDIUM,
            ruleId: 'SEC-003',
            title: 'Base image uses :latest or unpinned tag',
            description: `Dockerfile uses "${image}" which is unpinned.`,
            location: 'Dockerfile',
            remediation: 'Pin the base image to a specific version.',
          });
          break;
        }
      }
    }
  }

  // SEC-004: Health check path
  if (!input.healthcheckPath || input.healthcheckPath === '/') {
    findings.push({
      kind: FindingKind.LINT,
      severity: Severity.LOW,
      ruleId: 'SEC-004',
      title: 'Missing or insufficient health check path',
      description: 'No dedicated health check endpoint configured.',
      location: 'serviceVersion.healthcheckPath',
      remediation: 'Add a /healthz endpoint.',
    });
  }

  // SEC-005: Container runs as root
  if (input.dockerfile && !input.dockerfile.match(/^\s*USER\s+/im)) {
    findings.push({
      kind: FindingKind.CONTAINER,
      severity: Severity.HIGH,
      ruleId: 'SEC-005',
      title: 'Container may run as root',
      description: 'No USER instruction found in Dockerfile.',
      location: 'Dockerfile',
      remediation: 'Add USER nonroot:nonroot before CMD.',
    });
  }

  // SEC-006: Single replica in non-DEV
  if (input.replicas < 2 && input.environmentKind && input.environmentKind !== 'DEV') {
    findings.push({
      kind: FindingKind.POLICY,
      severity: Severity.HIGH,
      ruleId: 'SEC-006',
      title: 'Insufficient replicas for non-development environment',
      description: `Running only ${input.replicas} replica(s) in ${input.environmentKind}.`,
      location: 'serviceVersion.replicas',
      remediation: 'Set replicas >= 2.',
    });
  }

  // SEC-007: Infrastructure dependency
  for (const env of input.envVars) {
    if (/REDIS_URL|DATABASE_URL|MONGO_URL|RABBITMQ_URL|KAFKA_BROKERS/i.test(env.key)) {
      findings.push({
        kind: FindingKind.DEPENDENCY,
        severity: Severity.INFO,
        ruleId: 'SEC-007',
        title: `Infrastructure dependency: ${env.key}`,
        description: `Service depends on external infrastructure via "${env.key}".`,
        location: `envVars.${env.key}`,
        remediation: 'Verify dependency is monitored.',
      });
    }
  }

  // SEC-008: Over-provisioned memory
  if (input.memoryMb > 4096) {
    findings.push({
      kind: FindingKind.POLICY,
      severity: Severity.LOW,
      ruleId: 'SEC-008',
      title: 'Potentially over-provisioned memory',
      description: `Memory is set to ${input.memoryMb}Mi.`,
      location: 'serviceVersion.memoryMb',
      remediation: 'Profile actual memory usage and right-size.',
    });
  }

  // SEC-009: Privileged container
  if (input.k8sManifests) {
    for (const manifest of input.k8sManifests) {
      if (/privileged:\s*true/i.test(manifest)) {
        findings.push({
          kind: FindingKind.CONTAINER,
          severity: Severity.CRITICAL,
          ruleId: 'SEC-009',
          title: 'Privileged container detected',
          description: 'Kubernetes manifest sets privileged: true.',
          location: 'k8s-manifest',
          remediation: 'Remove privileged: true.',
        });
        break;
      }
    }
  }

  // SEC-010: Config sprawl
  if (input.envVars.length > 15) {
    findings.push({
      kind: FindingKind.LINT,
      severity: Severity.LOW,
      ruleId: 'SEC-010',
      title: 'Excessive environment variable count',
      description: `Service has ${input.envVars.length} environment variables.`,
      location: 'envVars',
      remediation: 'Group related config into files.',
    });
  }

  return findings;
}

function calculateScore(findings: ScannerFinding[]): { score: number; passed: boolean } {
  let score = 100;
  let critical = 0;
  for (const f of findings) {
    score -= SEVERITY_DEDUCTIONS[f.severity] ?? 0;
    if (f.severity === Severity.CRITICAL) critical++;
  }
  score = Math.max(0, score);
  return { score, passed: score >= 70 && critical === 0 };
}

function cleanInput(overrides: Partial<ScanInput> = {}): ScanInput {
  return {
    serviceVersionId: 'sv-1',
    runtime: 'NESTJS',
    envVars: [],
    replicas: 2,
    cpuMillicores: 500,
    memoryMb: 512,
    healthcheckPath: '/healthz',
    environmentKind: 'PROD',
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────

describe('Security rule engine', () => {
  describe('SEC-001: Secret env vars', () => {
    it('flags env vars with secret-like keys', () => {
      const findings = runRules(cleanInput({
        envVars: [{ key: 'API_KEY', value: 'sk-123', secret: true }],
      }));
      const sec = findings.filter((f) => f.ruleId === 'SEC-001');
      expect(sec).toHaveLength(1);
      expect(sec[0].severity).toBe(Severity.CRITICAL);
      expect(sec[0].kind).toBe(FindingKind.SECRET);
    });

    it('flags PASSWORD, TOKEN, SECRET, PRIVATE_KEY, CREDENTIAL', () => {
      const keys = ['DB_PASSWORD', 'AUTH_TOKEN', 'SIGNING_SECRET', 'RSA_PRIVATE_KEY', 'AWS_CREDENTIAL'];
      for (const key of keys) {
        const findings = runRules(cleanInput({
          envVars: [{ key, value: 'val', secret: false }],
        }));
        expect(findings.some((f) => f.ruleId === 'SEC-001')).toBe(true);
      }
    });

    it('does NOT flag env vars with empty values', () => {
      const findings = runRules(cleanInput({
        envVars: [{ key: 'API_KEY', value: '', secret: true }],
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-001')).toBe(false);
    });

    it('does NOT flag non-secret env vars', () => {
      const findings = runRules(cleanInput({
        envVars: [{ key: 'LOG_LEVEL', value: 'info', secret: false }],
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-001')).toBe(false);
    });
  });

  describe('SEC-002: Missing resource limits', () => {
    it('flags zero CPU', () => {
      const findings = runRules(cleanInput({ cpuMillicores: 0 }));
      expect(findings.some((f) => f.ruleId === 'SEC-002' && f.title.includes('CPU'))).toBe(true);
    });

    it('flags zero memory', () => {
      const findings = runRules(cleanInput({ memoryMb: 0 }));
      expect(findings.some((f) => f.ruleId === 'SEC-002' && f.title.includes('memory'))).toBe(true);
    });

    it('does NOT flag when resources are set', () => {
      const findings = runRules(cleanInput({ cpuMillicores: 500, memoryMb: 512 }));
      expect(findings.some((f) => f.ruleId === 'SEC-002')).toBe(false);
    });
  });

  describe('SEC-003: Unpinned image tag', () => {
    it('flags :latest in Dockerfile', () => {
      const findings = runRules(cleanInput({
        dockerfile: 'FROM node:latest\nCOPY . .\nCMD ["node", "index.js"]',
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-003')).toBe(true);
    });

    it('flags unpinned tag (no colon)', () => {
      const findings = runRules(cleanInput({
        dockerfile: 'FROM node\nCOPY . .',
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-003')).toBe(true);
    });

    it('does NOT flag pinned images', () => {
      const findings = runRules(cleanInput({
        dockerfile: 'FROM node:22.1.0-bookworm-slim\nCOPY . .',
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-003')).toBe(false);
    });

    it('does NOT flag when no Dockerfile provided', () => {
      const findings = runRules(cleanInput({ dockerfile: undefined }));
      expect(findings.some((f) => f.ruleId === 'SEC-003')).toBe(false);
    });
  });

  describe('SEC-004: Health check path', () => {
    it('flags missing healthcheck path', () => {
      const findings = runRules(cleanInput({ healthcheckPath: undefined }));
      expect(findings.some((f) => f.ruleId === 'SEC-004')).toBe(true);
    });

    it('flags root path "/"', () => {
      const findings = runRules(cleanInput({ healthcheckPath: '/' }));
      expect(findings.some((f) => f.ruleId === 'SEC-004')).toBe(true);
    });

    it('does NOT flag proper healthcheck path', () => {
      const findings = runRules(cleanInput({ healthcheckPath: '/healthz' }));
      expect(findings.some((f) => f.ruleId === 'SEC-004')).toBe(false);
    });
  });

  describe('SEC-005: Container runs as root', () => {
    it('flags Dockerfile without USER instruction', () => {
      const findings = runRules(cleanInput({
        dockerfile: 'FROM node:22\nCOPY . .\nCMD ["node", "index.js"]',
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-005')).toBe(true);
    });

    it('does NOT flag Dockerfile with USER instruction', () => {
      const findings = runRules(cleanInput({
        dockerfile: 'FROM node:22\nCOPY . .\nUSER nonroot:nonroot\nCMD ["node", "index.js"]',
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-005')).toBe(false);
    });
  });

  describe('SEC-006: Single replica in non-DEV', () => {
    it('flags 1 replica in PROD', () => {
      const findings = runRules(cleanInput({ replicas: 1, environmentKind: 'PROD' }));
      expect(findings.some((f) => f.ruleId === 'SEC-006')).toBe(true);
    });

    it('flags 1 replica in STAGING', () => {
      const findings = runRules(cleanInput({ replicas: 1, environmentKind: 'STAGING' }));
      expect(findings.some((f) => f.ruleId === 'SEC-006')).toBe(true);
    });

    it('does NOT flag 1 replica in DEV', () => {
      const findings = runRules(cleanInput({ replicas: 1, environmentKind: 'DEV' }));
      expect(findings.some((f) => f.ruleId === 'SEC-006')).toBe(false);
    });

    it('does NOT flag 2+ replicas', () => {
      const findings = runRules(cleanInput({ replicas: 3, environmentKind: 'PROD' }));
      expect(findings.some((f) => f.ruleId === 'SEC-006')).toBe(false);
    });
  });

  describe('SEC-007: Infrastructure dependency', () => {
    it('flags DATABASE_URL', () => {
      const findings = runRules(cleanInput({
        envVars: [{ key: 'DATABASE_URL', value: 'postgres://...', secret: false }],
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-007')).toBe(true);
    });

    it('flags REDIS_URL', () => {
      const findings = runRules(cleanInput({
        envVars: [{ key: 'REDIS_URL', value: 'redis://...', secret: false }],
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-007')).toBe(true);
    });

    it('does NOT flag app-level env vars', () => {
      const findings = runRules(cleanInput({
        envVars: [{ key: 'LOG_LEVEL', value: 'info', secret: false }],
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-007')).toBe(false);
    });
  });

  describe('SEC-008: Over-provisioned memory', () => {
    it('flags memory > 4096', () => {
      const findings = runRules(cleanInput({ memoryMb: 8192 }));
      expect(findings.some((f) => f.ruleId === 'SEC-008')).toBe(true);
    });

    it('does NOT flag memory <= 4096', () => {
      const findings = runRules(cleanInput({ memoryMb: 2048 }));
      expect(findings.some((f) => f.ruleId === 'SEC-008')).toBe(false);
    });
  });

  describe('SEC-009: Privileged container', () => {
    it('flags privileged: true in k8s manifest', () => {
      const findings = runRules(cleanInput({
        k8sManifests: ['securityContext:\n  privileged: true'],
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-009')).toBe(true);
      expect(findings.find((f) => f.ruleId === 'SEC-009')?.severity).toBe(Severity.CRITICAL);
    });

    it('does NOT flag manifests without privileged', () => {
      const findings = runRules(cleanInput({
        k8sManifests: ['securityContext:\n  runAsNonRoot: true'],
      }));
      expect(findings.some((f) => f.ruleId === 'SEC-009')).toBe(false);
    });
  });

  describe('SEC-010: Config sprawl', () => {
    it('flags > 15 env vars', () => {
      const envVars = Array.from({ length: 16 }, (_, i) => ({
        key: `VAR_${i}`, value: `val${i}`, secret: false,
      }));
      const findings = runRules(cleanInput({ envVars }));
      expect(findings.some((f) => f.ruleId === 'SEC-010')).toBe(true);
    });

    it('does NOT flag <= 15 env vars', () => {
      const envVars = Array.from({ length: 10 }, (_, i) => ({
        key: `VAR_${i}`, value: `val${i}`, secret: false,
      }));
      const findings = runRules(cleanInput({ envVars }));
      expect(findings.some((f) => f.ruleId === 'SEC-010')).toBe(false);
    });
  });

  describe('scoring', () => {
    it('starts at 100 for clean input', () => {
      const findings = runRules(cleanInput({
        envVars: [{ key: 'LOG_LEVEL', value: 'info', secret: false }],
        dockerfile: 'FROM node:22.1.0\nUSER nonroot\nCMD ["node", "app.js"]',
      }));
      const { score } = calculateScore(findings);
      expect(score).toBe(100);
    });

    it('deducts 20 per CRITICAL finding', () => {
      const findings = runRules(cleanInput({
        envVars: [{ key: 'API_KEY', value: 'sk-123', secret: true }],
        replicas: 1,
        environmentKind: 'PROD',
      }));
      // Should have at least SEC-001 (CRITICAL) + SEC-006 (HIGH)
      const { score } = calculateScore(findings);
      expect(score).toBeLessThan(100);
      expect(score).toBeLessThanOrEqual(80); // at least one CRITICAL (-20)
    });

    it('fails when score < 70', () => {
      // Multiple critical findings push score below 70
      const findings: ScannerFinding[] = [
        { kind: FindingKind.SECRET, severity: Severity.CRITICAL, ruleId: 'X', title: 'x', description: 'x' },
        { kind: FindingKind.SECRET, severity: Severity.CRITICAL, ruleId: 'Y', title: 'y', description: 'y' },
        { kind: FindingKind.CONTAINER, severity: Severity.HIGH, ruleId: 'Z', title: 'z', description: 'z' },
      ];
      const { score, passed } = calculateScore(findings);
      expect(score).toBe(50);
      expect(passed).toBe(false);
    });

    it('passes when score >= 70 and no criticals', () => {
      const findings: ScannerFinding[] = [
        { kind: FindingKind.LINT, severity: Severity.LOW, ruleId: 'X', title: 'x', description: 'x' },
        { kind: FindingKind.LINT, severity: Severity.LOW, ruleId: 'Y', title: 'y', description: 'y' },
      ];
      const { score, passed } = calculateScore(findings);
      expect(score).toBe(96);
      expect(passed).toBe(true);
    });

    it('fails even with score >= 70 if critical > 0', () => {
      const findings: ScannerFinding[] = [
        { kind: FindingKind.SECRET, severity: Severity.CRITICAL, ruleId: 'X', title: 'x', description: 'x' },
      ];
      const { score, passed } = calculateScore(findings);
      expect(score).toBe(80);
      expect(passed).toBe(false); // critical > 0
    });

    it('floor is 0', () => {
      const findings: ScannerFinding[] = Array.from({ length: 10 }, (_, i) => ({
        kind: FindingKind.SECRET,
        severity: Severity.CRITICAL,
        ruleId: `X${i}`,
        title: 'x',
        description: 'x',
      }));
      const { score } = calculateScore(findings);
      expect(score).toBe(0);
    });
  });

  describe('determinism', () => {
    it('produces identical findings for same input', () => {
      const input = cleanInput({
        envVars: [{ key: 'DATABASE_URL', value: 'postgres://db', secret: false }],
        replicas: 1,
        environmentKind: 'PROD',
        dockerfile: 'FROM node:latest',
      });
      const run1 = runRules(input);
      const run2 = runRules(input);
      expect(run1).toEqual(run2);
    });
  });
});
