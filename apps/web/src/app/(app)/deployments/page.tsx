'use client';

import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Rocket } from 'lucide-react';

export default function DeploymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Deployments" description="All deployments and rollout history across services" />
      <EmptyState
        icon={Rocket}
        title="Deployments view"
        description="Full deployment table with rollout history — coming in the next frontend pass"
      />
    </div>
  );
}
