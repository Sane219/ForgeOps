'use client';

import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { ScrollText } from 'lucide-react';

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" description="Activity log of all platform actions" />
      <EmptyState
        icon={ScrollText}
        title="Audit trail"
        description="Event timeline and audit log — coming in the next frontend pass"
      />
    </div>
  );
}
