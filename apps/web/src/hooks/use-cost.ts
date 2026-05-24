'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

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

export interface CostEstimate {
  id: string;
  rolloutId: string;
  monthlyUsd: number;
  cpuUsd: number;
  memoryUsd: number;
  egressUsd: number;
  storageUsd: number;
  warnings: CostWarning[];
  suggestions: CostSuggestion[];
  pricingVersion: string;
  createdAt: string;
}

export interface CostInput {
  replicas: number;
  cpuMillicores: number;
  memoryMb: number;
  egressGbPerMonth?: number;
  storageGb?: number;
}

export function useServiceCost(serviceId: string) {
  return useQuery({
    queryKey: queryKeys.services.cost(serviceId),
    queryFn: () => apiFetch<CostEstimate[]>(`/services/${serviceId}/cost`),
    enabled: !!serviceId,
  });
}

export function useCostEstimate() {
  return useMutation({
    mutationFn: (input: CostInput) =>
      apiFetch<CostEstimate>('/cost/estimate', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}
