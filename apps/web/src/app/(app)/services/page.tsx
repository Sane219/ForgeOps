'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useServices, type Service, type Deployment } from '@/hooks/use-services';
import { useDeployments } from '@/hooks/use-dashboard';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TableSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Boxes,
  Plus,
  Search,
  ArrowUpRight,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const RUNTIME_LABELS: Record<string, string> = {
  NEXTJS: 'Next.js',
  NESTJS: 'NestJS',
  FASTAPI: 'FastAPI',
  PYTHON_WORKER: 'Python Worker',
  GO_SERVICE: 'Go Service',
  STATIC: 'Static',
};

const RUNTIME_COLORS: Record<string, string> = {
  NEXTJS: 'bg-blue-400/10 text-blue-400',
  NESTJS: 'bg-red-400/10 text-red-400',
  FASTAPI: 'bg-emerald-400/10 text-emerald-400',
  PYTHON_WORKER: 'bg-amber-400/10 text-amber-400',
  GO_SERVICE: 'bg-cyan-400/10 text-cyan-400',
  STATIC: 'bg-zinc-400/10 text-zinc-400',
};

interface EnrichedService extends Service {
  deploymentCount: number;
  healthStatus: string;
  latestVersionDisplay: string | number;
  lastDeployed: string | null;
  latestRolloutStatus: string | null;
}

function enrichService(svc: Service, deploymentData: Deployment[]): EnrichedService {
  const svcDeployments = deploymentData.filter((d) => d.serviceId === svc.id);
  const hasUnhealthy = svcDeployments.some(
    (d) => d.health === 'UNHEALTHY' || d.health === 'DEGRADED',
  );
  const latestRollout = svcDeployments
    .flatMap((d) => d.rollouts ?? [])
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

  return {
    ...svc,
    deploymentCount: svcDeployments.length,
    healthStatus: hasUnhealthy ? 'UNHEALTHY' : svcDeployments.length > 0 ? 'HEALTHY' : 'NONE',
    latestVersionDisplay: svc.versions?.[0]?.version ?? svc.latestVersion ?? '—',
    lastDeployed: latestRollout?.startedAt ?? null,
    latestRolloutStatus: latestRollout?.status ?? null,
  };
}

export default function ServicesPage() {
  const services = useServices();
  const deployments = useDeployments();
  const [search, setSearch] = useState('');
  const [runtimeFilter, setRuntimeFilter] = useState<string>('');

  const isLoading = services.isLoading;

  const enrichedServices = (services.data ?? []).map((svc) =>
    enrichService(svc, (deployments.data ?? []) as unknown as Deployment[]),
  );

  const filtered = enrichedServices.filter((svc) => {
    const matchesSearch = !search || svc.name.toLowerCase().includes(search.toLowerCase()) || svc.slug.toLowerCase().includes(search.toLowerCase());
    const matchesRuntime = !runtimeFilter || svc.runtime === runtimeFilter;
    return matchesSearch && matchesRuntime;
  });

  const runtimes = [...new Set((services.data ?? []).map((s) => s.runtime))].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title="Services" description="Manage your platform services">
        <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500" asChild>
          <Link href="/app/services/new">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create Service
          </Link>
        </Button>
      </PageHeader>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-zinc-800 bg-zinc-950 pl-9 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {runtimes.map((rt) => (
            <button
              key={rt}
              onClick={() => setRuntimeFilter(runtimeFilter === rt ? '' : rt)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                runtimeFilter === rt
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300',
              )}
            >
              {RUNTIME_LABELS[rt] ?? rt}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : filtered.length === 0 ? (
        services.data?.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No services yet"
            description="Create your first service to get started with deployments"
            action={{ label: 'Create Service', onClick: () => {} }}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No services match your filters"
            description="Try adjusting your search or runtime filter"
          />
        )
      ) : (
        <div className="rounded-lg border border-zinc-800/80">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800/80 hover:bg-transparent">
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Service</TableHead>
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Runtime</TableHead>
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Latest Version</TableHead>
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Status</TableHead>
                <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Deployments</TableHead>
                <TableHead className="h-10 w-10 px-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((svc) => (
                <TableRow
                  key={svc.id}
                  className="border-zinc-800/40 transition-colors hover:bg-zinc-800/30"
                >
                  <TableCell className="px-4 py-2.5">
                    <Link href={`/app/services/${svc.id}`} className="group flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800/50">
                        <Code2 className="h-3.5 w-3.5 text-zinc-400" />
                      </div>
                      <div>
                        <span className="text-[13px] font-medium text-zinc-200 transition-colors group-hover:text-indigo-400">
                          {svc.name}
                        </span>
                        <p className="text-[11px] text-zinc-500">{svc.slug}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[11px] font-medium',
                      RUNTIME_COLORS[svc.runtime] ?? 'bg-zinc-800 text-zinc-400',
                    )}>
                      {RUNTIME_LABELS[svc.runtime] ?? svc.runtime}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-[13px] text-zinc-300">
                    v{svc.latestVersionDisplay}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    {svc.latestRolloutStatus ? (
                      <StatusBadge status={svc.latestRolloutStatus} />
                    ) : (
                      <span className="text-[11px] text-zinc-600">No deployments</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-[13px] text-zinc-300">
                    {svc.deploymentCount}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <Link
                      href={`/app/services/${svc.id}`}
                      className="text-zinc-600 transition-colors hover:text-zinc-300"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
