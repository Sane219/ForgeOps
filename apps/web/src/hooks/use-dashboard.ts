'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

interface Incident {
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

interface DeploymentWithRelations {
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
