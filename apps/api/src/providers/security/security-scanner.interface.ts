import type { FindingKind, Severity } from '@prisma/client';

export interface ScannerFinding {
  kind: FindingKind;
  severity: Severity;
  ruleId: string;
  title: string;
  description: string;
  location?: string;
  remediation?: string;
}

export interface ScanInput {
  serviceVersionId: string;
  runtime: string;
  dockerfile?: string;
  k8sManifests?: string[];
  envVars: Array<{ key: string; value: string; secret: boolean }>;
  replicas: number;
  cpuMillicores: number;
  memoryMb: number;
  healthcheckPath?: string;
  environmentKind?: string;
}

export interface ScanResult {
  scannerName: string;
  passed: boolean;
  score: number;
  findings: ScannerFinding[];
}

export const SECURITY_SCANNER = Symbol('SECURITY_SCANNER');

export interface SecurityScanner {
  scan(input: ScanInput): Promise<ScanResult>;
}
