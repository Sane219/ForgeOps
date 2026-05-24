import { Injectable } from '@nestjs/common';
import type {
  ScanInput,
  ScanResult,
  ScannerFinding,
  SecurityScanner,
} from './security-scanner.interface';
import { FindingKind, Severity } from '@prisma/client';

const SECRET_PATTERN = /PASSWORD|TOKEN|SECRET|API_KEY|PRIVATE_KEY|CREDENTIAL|AUTH/i;

const SEVERITY_DEDUCTIONS: Record<string, number> = {
  CRITICAL: 20,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 2,
  INFO: 1,
};

@Injectable()
export class MockSecurityScanner implements SecurityScanner {
  async scan(input: ScanInput): Promise<ScanResult> {
    const findings: ScannerFinding[] = [];

    // SEC-001: Suspicious env var names implying secrets
    for (const env of input.envVars) {
      if (SECRET_PATTERN.test(env.key) && env.value.length > 0) {
        findings.push({
          kind: FindingKind.SECRET,
          severity: Severity.CRITICAL,
          ruleId: 'SEC-001',
          title: 'Suspicious secret in environment variable',
          description: `Variable "${env.key}" appears to contain a secret value. Secrets should not be embedded in service configuration.`,
          location: `envVars.${env.key}`,
          remediation: 'Move this secret to a dedicated secrets manager (e.g., Vault, AWS Secrets Manager) or Kubernetes Secret.',
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
        description: 'Container has no CPU limit configured. This allows unbounded CPU consumption and potential noisy-neighbor issues.',
        location: 'serviceVersion.cpuMillicores',
        remediation: 'Set a CPU resource limit (e.g., 500m for light workloads, 1000m for compute-heavy services).',
      });
    }
    if (!input.memoryMb || input.memoryMb <= 0) {
      findings.push({
        kind: FindingKind.CONTAINER,
        severity: Severity.HIGH,
        ruleId: 'SEC-002',
        title: 'No memory resource limit set',
        description: 'Container has no memory limit configured. This can lead to OOM kills affecting neighboring pods.',
        location: 'serviceVersion.memoryMb',
        remediation: 'Set a memory limit appropriate for the workload (e.g., 512Mi for APIs, 2Gi+ for ML workers).',
      });
    }

    // SEC-003: Unpinned / :latest image tag
    if (!input.runtime) {
      // skip if no runtime info
    } else {
      // We infer from the serviceVersion image field — passed via envVars or directly
      // The actual image is not in ScanInput, so we check the runtime as a proxy
      // This rule will be more useful when dockerfile content is provided
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
                description: `Dockerfile uses "${image}" which is unpinned. Builds may produce inconsistent results.`,
                location: 'Dockerfile',
                remediation: 'Pin the base image to a specific version or SHA256 digest.',
              });
              break; // one finding per scan
            }
          }
        }
      }
    }

    // SEC-004: Missing or bare health check path
    if (!input.healthcheckPath || input.healthcheckPath === '/') {
      findings.push({
        kind: FindingKind.LINT,
        severity: Severity.LOW,
        ruleId: 'SEC-004',
        title: 'Missing or insufficient health check path',
        description: 'No dedicated health check endpoint configured. Load balancers cannot verify container readiness.',
        location: 'serviceVersion.healthcheckPath',
        remediation: 'Add a /healthz or /readyz endpoint that returns 200 when the service is ready to accept traffic.',
      });
    }

    // SEC-005: Container runs as root (check Dockerfile)
    if (input.dockerfile && !input.dockerfile.match(/^\s*USER\s+/im)) {
      findings.push({
        kind: FindingKind.CONTAINER,
        severity: Severity.HIGH,
        ruleId: 'SEC-005',
        title: 'Container may run as root',
        description: 'No USER instruction found in Dockerfile. Containers default to running as root, increasing attack surface.',
        location: 'Dockerfile',
        remediation: 'Add "USER nonroot:nonroot" or similar before the CMD instruction.',
      });
    }

    // SEC-006: Single replica in non-DEV
    if (input.replicas < 2 && input.environmentKind && input.environmentKind !== 'DEV') {
      findings.push({
        kind: FindingKind.POLICY,
        severity: Severity.HIGH,
        ruleId: 'SEC-006',
        title: 'Insufficient replicas for non-development environment',
        description: `Running only ${input.replicas} replica(s) in ${input.environmentKind}. A single point of failure will cause downtime during restarts.`,
        location: 'serviceVersion.replicas',
        remediation: 'Set replicas >= 2 for redundancy in staging and production environments.',
      });
    }

    // SEC-007: Infrastructure dependency detection
    for (const env of input.envVars) {
      if (/REDIS_URL|DATABASE_URL|MONGO_URL|RABBITMQ_URL|KAFKA_BROKERS/i.test(env.key)) {
        findings.push({
          kind: FindingKind.DEPENDENCY,
          severity: Severity.INFO,
          ruleId: 'SEC-007',
          title: `Infrastructure dependency: ${env.key}`,
          description: `Service depends on external infrastructure via "${env.key}". Ensure this dependency is monitored and has failover configured.`,
          location: `envVars.${env.key}`,
          remediation: 'Verify the dependency is included in the service\'s SLO and has appropriate retry/circuit-breaker logic.',
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
        description: `Memory is set to ${input.memoryMb}Mi, which is unusually high. Verify this is justified by workload characteristics.`,
        location: 'serviceVersion.memoryMb',
        remediation: 'Profile actual memory usage and right-size. Consider setting requests lower than limits.',
      });
    }

    // SEC-009: Privileged container in K8s manifest
    if (input.k8sManifests) {
      for (const manifest of input.k8sManifests) {
        if (/privileged:\s*true/i.test(manifest)) {
          findings.push({
            kind: FindingKind.CONTAINER,
            severity: Severity.CRITICAL,
            ruleId: 'SEC-009',
            title: 'Privileged container detected',
            description: 'Kubernetes manifest sets privileged: true. This grants the container full host access and is a severe security risk.',
            location: 'k8s-manifest',
            remediation: 'Remove "privileged: true" and use specific capabilities if needed. Consider using a PodSecurityPolicy.',
          });
          break;
        }
      }
    }

    // SEC-010: Config sprawl (too many env vars)
    if (input.envVars.length > 15) {
      findings.push({
        kind: FindingKind.LINT,
        severity: Severity.LOW,
        ruleId: 'SEC-010',
        title: 'Excessive environment variable count',
        description: `Service has ${input.envVars.length} environment variables. This may indicate configuration sprawl or insufficient use of config files.`,
        location: 'envVars',
        remediation: 'Consider grouping related config into files or a config service. Aim for < 10 env vars per service.',
      });
    }

    // Calculate score
    let score = 100;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let info = 0;

    for (const finding of findings) {
      score -= SEVERITY_DEDUCTIONS[finding.severity] ?? 0;
      switch (finding.severity) {
        case Severity.CRITICAL: critical++; break;
        case Severity.HIGH: high++; break;
        case Severity.MEDIUM: medium++; break;
        case Severity.LOW: low++; break;
        case Severity.INFO: info++; break;
      }
    }

    score = Math.max(0, score);

    return {
      scannerName: 'forgeops-mock',
      passed: score >= 70 && critical === 0,
      score,
      findings,
    };
  }
}
