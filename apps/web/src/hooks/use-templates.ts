'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface TemplateSummary {
  key: string;
  name: string;
  description: string;
  runtime: string;
  iconKey: string;
  defaultPort: number;
  defaultHealthcheckPath: string;
  defaultEnvVars: Array<{ key: string; value: string; secret: boolean }>;
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => apiFetch<TemplateSummary[]>('/templates'),
  });
}
