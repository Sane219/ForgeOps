'use client';

import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Boxes } from 'lucide-react';

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Service" description="Scaffold a new service from a template" />
      <EmptyState
        icon={<Boxes className="h-8 w-8" />}
        title="Create Service wizard"
        description="Multi-step service creation form — coming in the next frontend pass"
      />
    </div>
  );
}
