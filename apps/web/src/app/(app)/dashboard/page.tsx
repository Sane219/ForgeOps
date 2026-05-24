'use client';

import { useServices } from '@/hooks/use-services';
import { useDeployments, useIncidents } from '@/hooks/use-dashboard';
import { PageHeader } from '@/components/page-header';
import { KpiCard, KpiCardSkeleton } from '@/components/kpi-card';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Rocket,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Deterministic activity data for the sparkline
const ACTIVITY_DATA = Array.from({ length: 14 }, (_, i) => {
  const day = new Date();
  day.setDate(day.getDate() - (13 - i));
  const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' });
  const hash = ((i * 2654435761 + 42) >>> 0) % 100;
  return {
    day: dayLabel,
    deployments: 2 + (hash % 6),
    success: 1 + (hash % 4),
  };
});

export default function DashboardPage() {
  const services = useServices();
  const deployments = useDeployments();
  const incidents = useIncidents();

  const isLoading = services.isLoading || deployments.isLoading;

  // Derive KPIs from data
  const totalServices = services.data?.length ?? 0;
  const healthyDeployments = (deployments.data ?? []).filter(
    (d) => d.health === 'HEALTHY',
  ).length;
  const totalDeployments = deployments.data?.length ?? 0;
  const openIncidents = (incidents.data ?? []).filter(
    (i) => i.status === 'OPEN',
  ).length;

  // Recent rollouts: flatten deployments' rollouts, sort by startedAt, take 8
  const allRollouts = (deployments.data ?? [])
    .flatMap((d) =>
      (d.rollouts ?? []).map((r) => ({
        ...r,
        serviceName: d.service?.name ?? d.serviceId,
        serviceId: d.serviceId,
        environment: d.environment?.kind ?? '—',
      })),
    )
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 8);

  // Unhealthy items for the attention widget
  const unhealthyDeployments = (deployments.data ?? []).filter(
    (d) => d.health === 'UNHEALTHY' || d.health === 'DEGRADED',
  );
  const attentionItems = [
    ...unhealthyDeployments.map((d) => ({
      type: 'deployment' as const,
      title: `${d.service?.name ?? 'Service'} — ${d.environment?.kind ?? ''}`,
      status: d.health,
      detail: d.rollouts?.[0]?.failureReason ?? null,
      time: d.lastUpdatedAt,
      href: `/app/services/${d.serviceId}`,
    })),
    ...(incidents.data ?? [])
      .filter((i) => i.status === 'OPEN')
      .map((i) => ({
        type: 'incident' as const,
        title: i.title,
        status: i.severity,
        detail: i.summary?.slice(0, 120) ?? null,
        time: i.startedAt,
        href: `/app/incidents/${i.id}`,
      })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your platform health and recent activity"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              label="Total Services"
              value={totalServices}
              icon={<Boxes className="h-4 w-4" />}
              tone="default"
            />
            <KpiCard
              label="Healthy Deployments"
              value={`${healthyDeployments}/${totalDeployments}`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone={healthyDeployments === totalDeployments && totalDeployments > 0 ? 'success' : 'default'}
            />
            <KpiCard
              label="Open Incidents"
              value={openIncidents}
              icon={<AlertTriangle className="h-4 w-4" />}
              tone={openIncidents > 0 ? 'danger' : 'success'}
            />
            <KpiCard
              label="Total Deployments"
              value={totalDeployments}
              icon={<Rocket className="h-4 w-4" />}
              tone="default"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Recent Rollouts — 2/3 width */}
        <Card className="border-zinc-800/80 bg-zinc-900/50 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-zinc-200">Recent Rollouts</CardTitle>
            <Link
              href="/app/deployments"
              className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-48 w-full bg-zinc-800/40" />
            ) : allRollouts.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">No rollouts yet</div>
            ) : (
              <div className="space-y-0">
                {allRollouts.map((r, i) => (
                  <Link
                    key={r.id}
                    href={`/app/services/${r.serviceId ?? ''}`}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-zinc-800/40',
                      i < allRollouts.length - 1 && 'border-b border-zinc-800/30',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-zinc-200">
                          {r.serviceName ?? 'Service'}
                        </span>
                        <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                          {r.environment}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                        <span>{r.imageTag ?? `v${r.serviceVersion?.version ?? '?'}`}</span>
                        {r.finishedAt && (
                          <>
                            <span className="text-zinc-700">·</span>
                            <span>{formatDuration(r.startedAt, r.finishedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention — 1/3 width */}
        <Card className="border-zinc-800/80 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-200">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full bg-zinc-800/30" />
                ))}
              </div>
            ) : attentionItems.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="rounded-lg bg-zinc-900 p-2.5 ring-1 ring-zinc-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="mt-3 text-xs text-zinc-500">All clear — nothing needs attention</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attentionItems.slice(0, 5).map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="block rounded-md border border-zinc-800/50 bg-zinc-950/50 p-2.5 transition-colors hover:bg-zinc-800/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12px] font-medium leading-tight text-zinc-200">{item.title}</span>
                      <StatusBadge status={item.status} className="shrink-0" />
                    </div>
                    {item.detail && (
                      <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500">{item.detail}</p>
                    )}
                    <p className="mt-1 text-[10px] text-zinc-600">{formatTimeAgo(item.time)}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="border-zinc-800/80 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-200">Deployment Activity (14 days)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ACTIVITY_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorDeployments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fafafa',
                }}
              />
              <Area
                type="monotone"
                dataKey="deployments"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorDeployments)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="success"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorSuccess)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
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
