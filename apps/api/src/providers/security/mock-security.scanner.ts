import { Injectable } from '@nestjs/common';
import type {
  ScanInput,
  ScanResult,
  SecurityScanner,
} from './security-scanner.interface';

/**
 * Day-5 deliverable: rule-based, **deterministic** scanner. Produces
 * realistic findings from the service + template config. Example rules
 * the production version will implement:
 *
 *   CONTAINER:  Dockerfile runs as root         → HIGH
 *   CONTAINER:  base image uses :latest tag     → MEDIUM
 *   SECRET:     env var named PASSWORD/TOKEN/KEY with non-empty value → CRITICAL
 *   DEPENDENCY: lockfile contains known-vulnerable CVEs (mocked CVE set) → mixed
 *   LINT:       missing healthcheck path        → LOW
 *   POLICY:     CPU/memory requests absent      → MEDIUM
 *   POLICY:     replicas < 2 in PROD            → HIGH
 *
 * Day-1 skeleton: returns an empty, passing report.
 */
@Injectable()
export class MockSecurityScanner implements SecurityScanner {
  async scan(_input: ScanInput): Promise<ScanResult> {
    return {
      scannerName: 'forgeops-mock',
      passed: true,
      score: 100,
      findings: [],
    };
  }
}
