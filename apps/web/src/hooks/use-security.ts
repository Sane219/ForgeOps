'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface SecurityFinding {
  id: string;
  kind: string;
  severity: string;
  ruleId: string;
  title: string;
  description: string;
  location: string | null;
  remediation: string | null;
}

export interface SecurityReport {
  id: string;
  rolloutId: string;
  passed: boolean;
  score: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  scannerName: string;
  createdAt: string;
  findings: SecurityFinding[];
}

export function useServiceSecurity(serviceId: string) {
  return useQuery({
    queryKey: queryKeys.services.security(serviceId),
    queryFn: () => apiFetch<SecurityReport[]>(`/services/${serviceId}/security`),
    enabled: !!serviceId,
  });
}
