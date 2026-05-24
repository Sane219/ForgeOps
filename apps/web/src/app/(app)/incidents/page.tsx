'use client';

import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { AlertTriangle } from 'lucide-react';

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Incidents" description="Active and resolved incidents across your services" />
      <EmptyState
        icon={AlertTriangle}
        title="Incidents view"
        description="Incident list with detail panel — coming in the next frontend pass"
      />
    </div>
  );
}
