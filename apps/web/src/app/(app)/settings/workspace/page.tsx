'use client';

import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Settings } from 'lucide-react';

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Workspace Settings" description="Manage workspace configuration and team members" />
      <EmptyState
        icon={Settings}
        title="Workspace settings"
        description="Workspace configuration, members, and environments — coming in the next frontend pass"
      />
    </div>
  );
}
