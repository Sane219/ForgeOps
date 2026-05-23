import { z } from 'zod';
import { FindingKind, Severity } from './enums';

export const severityEnum = z.enum([
  Severity.CRITICAL,
  Severity.HIGH,
  Severity.MEDIUM,
  Severity.LOW,
  Severity.INFO,
]);

export const findingKindEnum = z.enum([
  FindingKind.CONTAINER,
  FindingKind.SECRET,
  FindingKind.DEPENDENCY,
  FindingKind.LINT,
  FindingKind.POLICY,
]);

export interface SecurityFindingSummary {
  id: string;
  kind: FindingKind;
  severity: Severity;
  ruleId: string;
  title: string;
  description: string;
  location: string | null;
  remediation: string | null;
}

export interface SecurityReportSummary {
  id: string;
  rolloutId: string;
  passed: boolean;
  score: number;
  counts: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFO: number;
  };
  scannerName: string;
  createdAt: string;
}

export interface SecurityReportDetail extends SecurityReportSummary {
  findings: SecurityFindingSummary[];
}
