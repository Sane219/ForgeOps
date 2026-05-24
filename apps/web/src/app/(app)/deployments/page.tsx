'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeployments } from '@/hooks/use-dashboard';
import { useRollbackDeployment } from '@/hooks/use-services';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TableSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Rocket,
  MoreHorizontal,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ENV_FILTERS = ['All', 'DEV', 'STAGING', 'PROD'] as const;
const STATUS_FILTERS = ['All', 'SUCCEEDED', 'FAILED', 'IN_PROGRESS', 'PENDING'] as const;

export default function DeploymentsPage() {
  const router = useRouter();
  const { data: deployments, isLoading } = useDeployments();
  const [envFilter, setEnvFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null);
  const rollback = useRollbackDeployment(rollbackTarget ?? '');

  // Flatten rollouts
  const rollouts = useMemo(() => {
    if (!deployments) return [];
    return deployments.flatMap((d) =>
      (d.rollouts ?? []).map((r) => ({
        ...r,
        serviceName: d.service?.name ?? d.serviceId,
        serviceId: d.serviceId,
        deploymentId: d.id,
        environment: d.environment?.kind ?? '—',
      })),
    );
  }, [deployments]);

  // Filter
  const filtered = useMemo(() => {
    return rollouts.filter((r) => {
      if (envFilter !== 'All' && r.environment !== envFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      return true;
    });
  }, [rollouts, envFilter, statusFilter]);

  // Sort by most recent
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [filtered],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deployments"
        description="All rollout history across services and environments"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">Environment:</span>
          {ENV_FILTERS.map((env) => (
            <button
              key={env}
              onClick={() => setEnvFilter(env)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                envFilter === env
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300',
              )}
            >
              {env}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">Status:</span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                statusFilter === s
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="No rollouts found"
          description={rollouts.length === 0 ? 'Trigger a deployment to see rollout history.' : 'Try adjusting your filters.'}
        />
      ) : (
        <div className="rounded-lg border border-zinc-800/80">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800/80 hover:bg-transparent">
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Service</TableHead>
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Env</TableHead>
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Version</TableHead>
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Status</TableHead>
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Failure</TableHead>
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Time</TableHead>
                <TableHead className="h-10 w-10 px-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.slice(0, 50).map((r) => (
                <TableRow
                  key={r.id}
                  className="border-zinc-800/40 transition-colors hover:bg-zinc-800/30"
                >
                  <TableCell className="px-4 py-2.5">
                    <button
                      onClick={() => router.push(`/app/services/${r.serviceId}`)}
                      className="text-[13px] font-medium text-zinc-200 transition-colors hover:text-indigo-400"
                    >
                      {r.serviceName}
                    </button>
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      {r.environment}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-[12px] text-zinc-400">
                    {r.imageTag ?? `v${r.serviceVersion?.version ?? '?'}`}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate px-4 py-2.5 text-[12px] text-red-400">
                    {r.failureReason ?? '—'}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-[12px] text-zinc-500">
                    {formatTimeAgo(r.startedAt)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-500">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-900">
                        <DropdownMenuItem
                          onClick={() => router.push(`/app/services/${r.serviceId}`)}
                          className="text-xs text-zinc-300 focus:bg-zinc-800"
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          View Service
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setRollbackTarget(r.deploymentId)}
                          className="text-xs text-zinc-300 focus:bg-zinc-800"
                        >
                          <RotateCcw className="mr-2 h-3.5 w-3.5" />
                          Rollback
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Rollback confirmation */}
      <AlertDialog open={!!rollbackTarget} onOpenChange={() => setRollbackTarget(null)}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Rollback deployment?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will create a new rollout using the last succeeded version. The current rollout will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rollbackTarget) {
                  rollback.mutate(undefined, { onSettled: () => setRollbackTarget(null) });
                }
              }}
              className="bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {rollback.isPending ? 'Rolling back...' : 'Rollback'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
