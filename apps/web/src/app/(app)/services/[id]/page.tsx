'use client';

import { use } from 'react';
import { useService, useServiceDeployments, type Service, type Deployment, type Rollout } from '@/hooks/use-services';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { PanelSkeleton, TableSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Code2,
  Rocket,
  Server,
  Heart,
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
  NEXTJS: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  NESTJS: 'bg-red-400/10 text-red-400 border-red-400/20',
  FASTAPI: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  PYTHON_WORKER: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  GO_SERVICE: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  STATIC: 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20',
};

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const service = useService(id);
  const deployments = useServiceDeployments(id);
  const svc = service.data as Service | undefined;
  const isLoading = service.isLoading;

  // Get latest version from service versions
  const latestVersion = svc?.versions?.[0]?.version ?? svc?.latestVersion ?? '—';

  // Flatten rollouts from all deployments
  const allRollouts = (deployments.data ?? [])
    .flatMap((d: Deployment) =>
      (d.rollouts ?? []).map((r: Rollout) => ({
        ...r,
        environment: d.environment?.kind ?? '—',
        deploymentId: d.id,
      })),
    )
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  // Get latest deployment for overview
  const latestDeployment = (deployments.data ?? [])[0];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <>
          <PanelSkeleton />
          <PanelSkeleton className="h-32" />
          <TableSkeleton rows={5} columns={4} />
        </>
      ) : !svc ? (
        <EmptyState
          icon={Server}
          title="Service not found"
          description="This service may have been deleted or you don't have access"
        />
      ) : (
        <>
          <PageHeader title={svc.name} description={svc.description ?? undefined}>
            <Badge
              variant="outline"
              className={cn('text-[11px]', RUNTIME_COLORS[svc.runtime])}
            >
              {RUNTIME_LABELS[svc.runtime] ?? svc.runtime}
            </Badge>
          </PageHeader>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-zinc-900/50 border border-zinc-800/80">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="versions" className="text-xs">Versions</TabsTrigger>
              <TabsTrigger value="deployments" className="text-xs">Deployments</TabsTrigger>
              <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
              <TabsTrigger value="cost" className="text-xs">Cost</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                  icon={<Code2 className="h-4 w-4 text-zinc-400" />}
                  label="Runtime"
                  value={RUNTIME_LABELS[svc.runtime] ?? svc.runtime}
                />
                <InfoCard
                  icon={<Server className="h-4 w-4 text-zinc-400" />}
                  label="Latest Version"
                  value={`v${latestVersion}`}
                />
                <InfoCard
                  icon={<Rocket className="h-4 w-4 text-zinc-400" />}
                  label="Deployments"
                  value={String(deployments.data?.length ?? 0)}
                />
                <InfoCard
                  icon={<Heart className="h-4 w-4 text-zinc-400" />}
                  label="Health"
                  value={latestDeployment?.health ?? 'No deployments'}
                  valueClassName={
                    latestDeployment?.health === 'HEALTHY'
                      ? 'text-emerald-400'
                      : latestDeployment?.health === 'UNHEALTHY'
                        ? 'text-red-400'
                        : 'text-zinc-400'
                  }
                />
              </div>

              {/* Service Info */}
              <Card className="border-zinc-800/80 bg-zinc-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-zinc-200">Service Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <DetailItem label="Slug" value={svc.slug} mono />
                    <DetailItem label="Template" value={svc.templateKey} />
                    <DetailItem label="Created" value={formatDate(svc.createdAt)} />
                    <DetailItem label="Owner" value={svc.ownerId ?? '—'} />
                    <DetailItem label="Tags" value={svc.tags?.join(', ') || '—'} />
                    <DetailItem label="Updated" value={formatDate(svc.updatedAt)} />
                  </div>
                </CardContent>
              </Card>

              {/* Latest Version Info */}
              {svc.versions?.[0] && (
                <Card className="border-zinc-800/80 bg-zinc-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-zinc-200">
                      Latest Version (v{svc.versions[0].version})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <DetailItem label="Replicas" value={String(svc.versions[0].replicas ?? '—')} />
                      <DetailItem label="CPU" value={svc.versions[0].cpuMillicores ? `${svc.versions[0].cpuMillicores}m` : '—'} />
                      <DetailItem label="Memory" value={svc.versions[0].memoryMb ? `${svc.versions[0].memoryMb}MB` : '—'} />
                      <DetailItem label="Port" value={String(svc.versions[0].port ?? '—')} mono />
                    </div>
                    {svc.versions[0].notes && (
                      <p className="mt-3 text-xs text-zinc-400">{svc.versions[0].notes}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Versions Tab */}
            <TabsContent value="versions">
              {(svc.versions?.length ?? 0) > 0 ? (
                <div className="rounded-lg border border-zinc-800/80">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800/80 hover:bg-transparent">
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Version</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Image</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Notes</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {svc.versions.map((v) => (
                        <TableRow key={v.id} className="border-zinc-800/40">
                          <TableCell className="px-4 py-2.5 font-mono text-[13px] text-zinc-200">v{v.version}</TableCell>
                          <TableCell className="px-4 py-2.5 font-mono text-[13px] text-zinc-300">{v.image ?? '—'}</TableCell>
                          <TableCell className="px-4 py-2.5 text-[13px] text-zinc-400">{v.notes ?? '—'}</TableCell>
                          <TableCell className="px-4 py-2.5 text-[13px] text-zinc-500">{formatDate(v.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState icon={Code2} title="No versions yet" description="Versions are created when you generate artifacts" />
              )}
            </TabsContent>

            {/* Deployments Tab */}
            <TabsContent value="deployments">
              {allRollouts.length > 0 ? (
                <div className="rounded-lg border border-zinc-800/80">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800/80 hover:bg-transparent">
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Status</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Environment</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Image Tag</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Failure Reason</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRollouts.map((r) => (
                        <TableRow key={r.id} className="border-zinc-800/40">
                          <TableCell className="px-4 py-2.5">
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell className="px-4 py-2.5">
                            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400">
                              {r.environment}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-2.5 font-mono text-[13px] text-zinc-300">{r.imageTag ?? '—'}</TableCell>
                          <TableCell className="px-4 py-2.5 text-[13px] text-zinc-400">{r.failureReason ?? '—'}</TableCell>
                          <TableCell className="px-4 py-2.5 text-[13px] text-zinc-500">{formatTimeAgo(r.startedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState icon={Rocket} title="No deployments yet" description="Trigger a deployment to see rollout history" />
              )}
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <EmptyState
                icon={Rocket}
                title="Security reports"
                description="Security scan results will appear here after deployments"
              />
            </TabsContent>

            {/* Cost Tab */}
            <TabsContent value="cost">
              <EmptyState
                icon={Rocket}
                title="Cost estimates"
                description="Cost estimates will appear here after deployments"
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, valueClassName }: { icon: React.ReactNode; label: string; value: string; valueClassName?: string }) {
  return (
    <Card className="border-zinc-800/80 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <p className={cn('mt-1.5 font-mono text-lg font-semibold text-zinc-100', valueClassName)}>{value}</p>
    </Card>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p className={cn('mt-0.5 text-[13px] text-zinc-200', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
