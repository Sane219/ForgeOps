/** TanStack Query key factory — keeps cache keys consistent across the app. */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  services: {
    all: ['services'] as const,
    detail: (id: string) => ['services', id] as const,
    deployments: (id: string) => ['services', id, 'deployments'] as const,
    security: (id: string) => ['services', id, 'security'] as const,
    cost: (id: string) => ['services', id, 'cost'] as const,
    versions: (id: string) => ['services', id, 'versions'] as const,
  },
  deployments: {
    all: ['deployments'] as const,
    detail: (id: string) => ['deployments', id] as const,
    rollouts: (id: string) => ['deployments', id, 'rollouts'] as const,
    logs: (id: string) => ['deployments', id, 'logs'] as const,
    metrics: (id: string) => ['deployments', id, 'metrics'] as const,
  },
  incidents: {
    all: ['incidents'] as const,
    detail: (id: string) => ['incidents', id] as const,
  },
  audit: {
    all: ['audit'] as const,
  },
  cost: {
    estimate: (rolloutId: string) => ['cost', 'estimate', rolloutId] as const,
  },
} as const;
