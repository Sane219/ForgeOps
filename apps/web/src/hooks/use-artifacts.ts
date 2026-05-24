'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface Artifact {
  id: string;
  serviceVersionId: string;
  kind: string;
  filename: string;
  content: string;
  contentType: string;
  generatorVersion: string;
  createdAt: string;
}

export function useServiceArtifacts(serviceId: string) {
  return useQuery({
    queryKey: ['services', serviceId, 'artifacts'],
    queryFn: () => apiFetch<Artifact[]>(`/services/${serviceId}/artifacts/latest`),
    enabled: !!serviceId,
  });
}

export function useGenerateArtifacts(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ count: number }>(`/services/${serviceId}/generate`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', serviceId, 'artifacts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.detail(serviceId) });
    },
  });
}
