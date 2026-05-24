'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  summary: string;
  startedAt: string;
  resolvedAt: string | null;
  deploymentId: string | null;
}

interface Rollout {
  id: string;
  status: string;
  imageTag: string;
  failureReason: string | null;
  startedAt: string;
  finishedAt: string | null;
  serviceVersionId: string;
  serviceVersion?: { version: number };
}

export interface DeploymentWithRelations {
  id: string;
  serviceId: string;
  health: string;
  restartCount: number;
  lastUpdatedAt: string;
  environmentId: string;
  currentRolloutId: string | null;
  environment?: { kind: string; name: string };
  service?: { name: string; slug: string };
  rollouts?: Rollout[];
}

export function useServices() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: () => apiFetch<Array<{ id: string; name: string; slug: string; runtime: string; createdAt: string }>>('/services'),
  });
}

export function useDeployments() {
  return useQuery({
    queryKey: queryKeys.deployments.all,
    queryFn: () => apiFetch<DeploymentWithRelations[]>('/deployments'),
  });
}

export function useIncidents() {
  return useQuery({
    queryKey: queryKeys.incidents.all,
    queryFn: () => apiFetch<Incident[]>('/incidents'),
  });
}

export function useServiceObservability(serviceId: string) {
  return useQuery({
    queryKey: ['services', serviceId, 'observability'],
    queryFn: () =>
      apiFetch<{
        deployments: Array<{ id: string; health: string; environment: { kind: string; name: string } }>;
        latestMetrics: Array<{ deploymentId: string; ts: string; cpuPct: number; memMb: number; rps: number; p95Ms: number; errorRate: number }>;
        incidents: Incident[];
      }>(`/services/${serviceId}/observability`),
    enabled: !!serviceId,
  });
}

export function useDeploymentRollouts(deploymentId: string) {
  return useQuery({
    queryKey: queryKeys.deployments.rollouts(deploymentId),
    queryFn: () => apiFetch<Rollout[]>(`/deployments/${deploymentId}/rollouts`),
    enabled: !!deploymentId,
  });
}

export function useDeploymentMetrics(deploymentId: string, from?: Date, to?: Date) {
  const fromStr = from?.toISOString() ?? new Date(Date.now() - 24 * 3600000).toISOString();
  const toStr = to?.toISOString() ?? new Date().toISOString();

  return useQuery({
    queryKey: [...queryKeys.deployments.metrics(deploymentId), fromStr, toStr],
    queryFn: () =>
      apiFetch<Array<{ ts: string; cpuPct: number; memMb: number; rps: number; p95Ms: number; errorRate: number }>>(
        `/deployments/${deploymentId}/metrics?from=${fromStr}&to=${toStr}&stepSeconds=3600`,
      ),
    enabled: !!deploymentId,
  });
}

export function useDeploymentLogs(deploymentId: string, from?: Date, to?: Date) {
  const fromStr = from?.toISOString() ?? new Date(Date.now() - 24 * 3600000).toISOString();
  const toStr = to?.toISOString() ?? new Date().toISOString();

  return useQuery({
    queryKey: [...queryKeys.deployments.logs(deploymentId), fromStr, toStr],
    queryFn: () =>
      apiFetch<Array<{ id: string; ts: string; level: string; message: string; meta?: Record<string, unknown> }>>(
        `/deployments/${deploymentId}/logs?from=${fromStr}&to=${toStr}&limit=100`,
      ),
    enabled: !!deploymentId,
  });
}
