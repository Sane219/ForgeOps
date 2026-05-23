import { z } from 'zod';
import { EnvKind } from './enums';

export const costInputSchema = z.object({
  replicas: z.number().int().min(1).max(50),
  cpuMillicores: z.number().int().min(50).max(8000),
  memoryMb: z.number().int().min(64).max(16384),
  egressGbPerMonth: z.number().min(0).max(1_000_000).default(50),
  storageGb: z.number().min(0).max(10_000).default(10),
  environmentKind: z.enum([EnvKind.DEV, EnvKind.STAGING, EnvKind.PROD]).optional(),
});
export type CostInput = z.infer<typeof costInputSchema>;

export interface CostWarning {
  code: string;
  message: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

export interface CostSuggestion {
  code: string;
  message: string;
  estimatedMonthlySavingsUsd: number;
}

export interface CostBreakdown {
  monthlyUsd: number;
  cpuUsd: number;
  memoryUsd: number;
  egressUsd: number;
  storageUsd: number;
  warnings: CostWarning[];
  suggestions: CostSuggestion[];
  pricingVersion: string;
}
