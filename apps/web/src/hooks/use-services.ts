'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';

export interface ServiceVersion {
  id: string;
  version: number;
  image: string;
  notes: string | null;
  replicas: number;
  cpuMillicores: number;
  memoryMb: number;
  port: number;
  healthcheckPath: string;
  createdAt: string;
}

export interface Rollout {
  id: string;
  status: string;
  imageTag: string;
  failureReason: string | null;
  startedAt: string;
  finishedAt: string | null;
  triggeredById: string | null;
  serviceVersionId: string;
  serviceVersion?: { version: number };
}

export interface Deployment {
  id: string;
  serviceId: string;
  environmentId: string;
  health: string;
  restartCount: number;
  lastUpdatedAt: string;
  currentRolloutId: string | null;
  environment?: { kind: string; name: string };
  rollouts?: Rollout[];
}

export interface Service {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  runtime: string;
  templateKey: string;
  ownerId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  latestVersion: number;
  versions?: ServiceVersion[];
  deployments?: Deployment[];
}

export function useServices() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: () => apiFetch<Service[]>('/services'),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => apiFetch<Service>(`/services/${id}`),
    enabled: !!id,
  });
}

export function useServiceDeployments(serviceId: string) {
  return useQuery({
    queryKey: queryKeys.services.deployments(serviceId),
    queryFn: () => apiFetch<Deployment[]>(`/services/${serviceId}/deployments`),
    enabled: !!serviceId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      slug: string;
      templateKey: string;
      description?: string;
      tags?: string[];
    }) =>
      apiFetch<Service>('/services', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      toast.success(`Service "${data.name}" created`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create service');
    },
  });
}

export function useTriggerRollout(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { environment: string }) =>
      apiFetch<{ id: string }>(`/services/${serviceId}/deployments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.deployments(serviceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all });
      toast.success('Rollout triggered');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to trigger rollout');
    },
  });
}

export function useRollbackDeployment(deploymentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>(`/deployments/${deploymentId}/rollback`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all });
      toast.success('Rollback initiated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Rollback failed');
    },
  });
}
