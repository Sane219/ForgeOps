'use client';

import { use, useState } from 'react';
import { useService, useServiceDeployments, useTriggerRollout, type Service, type Deployment, type Rollout } from '@/hooks/use-services';
import { useServiceSecurity } from '@/hooks/use-security';
import { useServiceCost } from '@/hooks/use-cost';
import { useServiceArtifacts, useGenerateArtifacts } from '@/hooks/use-artifacts';
import { useServiceObservability } from '@/hooks/use-dashboard';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { PanelSkeleton, TableSkeleton, ChartSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/empty-state';
import { CodeViewer } from '@/components/code-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Code2,
  Rocket,
  Server,
  Heart,
  Wand2,
  Shield,
  DollarSign,
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400',
  HIGH: 'bg-orange-500/10 text-orange-400',
  MEDIUM: 'bg-amber-500/10 text-amber-400',
  LOW: 'bg-blue-500/10 text-blue-400',
  INFO: 'bg-zinc-500/10 text-zinc-400',
};

const ARTIFACT_KIND_LABELS: Record<string, string> = {
  DOCKERFILE: 'Dockerfile',
  K8S_MANIFEST: 'K8s Manifest',
  HELM_VALUES: 'Helm Values',
  CI_PIPELINE: 'CI Pipeline',
  ARGO_APP: 'ArgoCD App',
};

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const service = useService(id);
  const deployments = useServiceDeployments(id);
  const security = useServiceSecurity(id);
  const cost = useServiceCost(id);
  const artifacts = useServiceArtifacts(id);
  const generateArtifacts = useGenerateArtifacts(id);
  const observability = useServiceObservability(id);
  const triggerRollout = useTriggerRollout(id);

  const svc = service.data as Service | undefined;
  const isLoading = service.isLoading;

  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  const [targetEnv, setTargetEnv] = useState('DEV');
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  const latestVersion = svc?.versions?.[0]?.version ?? svc?.latestVersion ?? '—';

  const allRollouts = (deployments.data ?? [])
    .flatMap((d: Deployment) =>
      (d.rollouts ?? []).map((r: Rollout) => ({
        ...r,
        environment: d.environment?.kind ?? '—',
        deploymentId: d.id,
      })),
    )
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const latestDeployment = (deployments.data ?? [])[0];

  const handleTrigger = () => {
    triggerRollout.mutate(
      { environment: targetEnv },
      { onSuccess: () => setShowTriggerDialog(false) },
    );
  };

  // Determine which artifact tab to show
  const currentArtifact = selectedArtifact
    ? (artifacts.data ?? []).find((a) => a.kind === selectedArtifact)
    : (artifacts.data ?? [])[0];

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
              <TabsTrigger value="observability" className="text-xs">Observability</TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard icon={<Code2 className="h-4 w-4 text-zinc-400" />} label="Runtime" value={RUNTIME_LABELS[svc.runtime] ?? svc.runtime} />
                <InfoCard icon={<Server className="h-4 w-4 text-zinc-400" />} label="Latest Version" value={`v${latestVersion}`} />
                <InfoCard icon={<Rocket className="h-4 w-4 text-zinc-400" />} label="Deployments" value={String(deployments.data?.length ?? 0)} />
                <InfoCard
                  icon={<Heart className="h-4 w-4 text-zinc-400" />}
                  label="Health"
                  value={latestDeployment?.health ?? 'No deployments'}
                  valueClassName={cn(
                    latestDeployment?.health === 'HEALTHY' && 'text-emerald-400',
                    latestDeployment?.health === 'UNHEALTHY' && 'text-red-400',
                    !latestDeployment && 'text-zinc-500',
                  )}
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
                    {svc.versions[0].notes && <p className="mt-3 text-xs text-zinc-400">{svc.versions[0].notes}</p>}
                  </CardContent>
                </Card>
              )}

              {/* Generate Artifacts */}
              <Card className="border-zinc-800/80 bg-zinc-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-medium text-zinc-200">Artifacts</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
                    onClick={() => generateArtifacts.mutate()}
                    disabled={generateArtifacts.isPending}
                  >
                    {generateArtifacts.isPending ? (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="mr-1.5 h-3 w-3" />
                    )}
                    Generate Artifacts
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {artifacts.isLoading ? (
                    <div className="h-20 animate-pulse rounded bg-zinc-800/30" />
                  ) : (artifacts.data ?? []).length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-500">
                      No artifacts generated yet. Click &quot;Generate Artifacts&quot; to create Dockerfile, K8s manifests, and more.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Artifact kind tabs */}
                      <div className="flex flex-wrap gap-1.5">
                        {(artifacts.data ?? []).map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setSelectedArtifact(a.kind)}
                            className={cn(
                              'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                              (selectedArtifact ?? (artifacts.data ?? [])[0]?.kind) === a.kind
                                ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300',
                            )}
                          >
                            {ARTIFACT_KIND_LABELS[a.kind] ?? a.kind}
                          </button>
                        ))}
                      </div>

                      {/* Code viewer */}
                      {currentArtifact && (
                        <CodeViewer
                          code={currentArtifact.content}
                          filename={currentArtifact.filename}
                          language={getLanguage(currentArtifact.kind)}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Versions Tab ── */}
            <TabsContent value="versions">
              {(svc.versions?.length ?? 0) > 0 ? (
                <div className="rounded-lg border border-zinc-800/80">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800/80 hover:bg-transparent">
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Version</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Image</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Replicas</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">CPU</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Memory</TableHead>
                        <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {svc.versions?.map((v) => (
                        <TableRow key={v.id} className="border-zinc-800/40">
                          <TableCell className="px-4 py-2.5 font-mono text-[13px] text-zinc-200">v{v.version}</TableCell>
                          <TableCell className="px-4 py-2.5 font-mono text-[12px] text-zinc-400">{v.image ?? '—'}</TableCell>
                          <TableCell className="px-4 py-2.5 text-[13px] text-zinc-300">{v.replicas}</TableCell>
                          <TableCell className="px-4 py-2.5 text-[13px] text-zinc-300">{v.cpuMillicores}m</TableCell>
                          <TableCell className="px-4 py-2.5 text-[13px] text-zinc-300">{v.memoryMb}MB</TableCell>
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

            {/* ── Deployments Tab ── */}
            <TabsContent value="deployments" className="space-y-4">
              {/* Trigger Rollout */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">Deploy this service to an environment</p>
                <Button
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-500"
                  onClick={() => setShowTriggerDialog(true)}
                >
                  <Rocket className="mr-1.5 h-3.5 w-3.5" />
                  Trigger Rollout
                </Button>
              </div>

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
                          <TableCell className="px-4 py-2.5"><StatusBadge status={r.status} /></TableCell>
                          <TableCell className="px-4 py-2.5">
                            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400">{r.environment}</span>
                          </TableCell>
                          <TableCell className="px-4 py-2.5 font-mono text-[13px] text-zinc-300">{r.imageTag ?? '—'}</TableCell>
                          <TableCell className="max-w-[200px] truncate px-4 py-2.5 text-[12px] text-red-400">{r.failureReason ?? '—'}</TableCell>
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

            {/* ── Security Tab ── */}
            <TabsContent value="security" className="space-y-4">
              {security.isLoading ? (
                <PanelSkeleton />
              ) : (security.data ?? []).length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No security reports"
                  description="Security scan results will appear here after deployments"
                />
              ) : (
                <>
                  {/* Latest report summary */}
                  {(() => {
                    const latest = security.data![0]!;
                    return (
                      <Card className={cn(
                        'border-zinc-800/80 bg-zinc-900/50',
                        latest && !latest.passed && 'border-red-500/20',
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {latest.passed ? (
                                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                              ) : (
                                <XCircle className="h-8 w-8 text-red-400" />
                              )}
                              <div>
                                <div className="font-mono text-2xl font-bold text-zinc-100">{latest.score}<span className="text-sm font-normal text-zinc-500">/100</span></div>
                                <StatusBadge status={latest.passed ? 'SUCCEEDED' : 'FAILED'} />
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-zinc-500">Scanner</div>
                              <div className="text-sm text-zinc-300">{latest.scannerName}</div>
                            </div>
                          </div>

                          {/* Severity breakdown */}
                          <div className="mt-4 flex gap-2">
                            {latest.critical > 0 && <Badge className="bg-red-500/10 text-red-400">{latest.critical} Critical</Badge>}
                            {latest.high > 0 && <Badge className="bg-orange-500/10 text-orange-400">{latest.high} High</Badge>}
                            {latest.medium > 0 && <Badge className="bg-amber-500/10 text-amber-400">{latest.medium} Medium</Badge>}
                            {latest.low > 0 && <Badge className="bg-blue-500/10 text-blue-400">{latest.low} Low</Badge>}
                            {latest.info > 0 && <Badge className="bg-zinc-500/10 text-zinc-400">{latest.info} Info</Badge>}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Findings table */}
                  {(() => {
                    const latest = security.data![0];
                    if (!latest) return null;
                    return latest.findings.length > 0 ? (
                      <div className="rounded-lg border border-zinc-800/80">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-800/80 hover:bg-transparent">
                              <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Severity</TableHead>
                              <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Kind</TableHead>
                              <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Rule</TableHead>
                              <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Title</TableHead>
                              <TableHead className="h-10 px-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Location</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {latest.findings.map((f) => (
                              <TableRow key={f.id} className="border-zinc-800/40">
                                <TableCell className="px-4 py-2.5">
                                  <Badge className={cn('text-[10px]', SEVERITY_COLORS[f.severity] ?? 'bg-zinc-800 text-zinc-400')}>{f.severity}</Badge>
                                </TableCell>
                                <TableCell className="px-4 py-2.5 text-[12px] text-zinc-400">{f.kind}</TableCell>
                                <TableCell className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">{f.ruleId}</TableCell>
                                <TableCell className="px-4 py-2.5 text-[13px] text-zinc-200">{f.title}</TableCell>
                                <TableCell className="max-w-[200px] truncate px-4 py-2.5 font-mono text-[11px] text-zinc-500">{f.location ?? '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
            </TabsContent>

            {/* ── Cost Tab ── */}
            <TabsContent value="cost" className="space-y-4">
              {cost.isLoading ? (
                <PanelSkeleton />
              ) : (cost.data ?? []).length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="No cost estimates"
                  description="Cost estimates will appear here after deployments"
                />
              ) : (
                (() => {
                  const latest = cost.data![0];
                  if (!latest) return null;
                  const total = latest.cpuUsd + latest.memoryUsd + latest.egressUsd + latest.storageUsd;
                  return (
                    <>
                      <Card className="border-zinc-800/80 bg-zinc-900/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-zinc-500">Monthly Estimate</div>
                              <div className="font-mono text-3xl font-bold text-zinc-100">${latest.monthlyUsd.toFixed(2)}</div>
                            </div>
                            <DollarSign className="h-8 w-8 text-zinc-600" />
                          </div>

                          {/* Breakdown bar */}
                          <div className="mt-4">
                            <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
                              {total > 0 && (
                                <>
                                  <div className="bg-blue-500" style={{ width: `${(latest.cpuUsd / total) * 100}%` }} />
                                  <div className="bg-emerald-500" style={{ width: `${(latest.memoryUsd / total) * 100}%` }} />
                                  <div className="bg-amber-500" style={{ width: `${(latest.egressUsd / total) * 100}%` }} />
                                  <div className="bg-zinc-500" style={{ width: `${(latest.storageUsd / total) * 100}%` }} />
                                </>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-4 text-xs">
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> CPU: ${latest.cpuUsd.toFixed(2)}</span>
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Memory: ${latest.memoryUsd.toFixed(2)}</span>
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Egress: ${latest.egressUsd.toFixed(2)}</span>
                              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-zinc-500" /> Storage: ${latest.storageUsd.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Warnings */}
                      {latest.warnings.length > 0 && (
                        <Card className="border-amber-500/20 bg-amber-950/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-amber-400">
                              <AlertTriangle className="h-4 w-4" />
                              Warnings
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {latest.warnings.map((w, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <Badge className={cn('mt-0.5 shrink-0 text-[10px]', w.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400')}>
                                    {w.severity}
                                  </Badge>
                                  <span className="text-zinc-300">{w.message}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Suggestions */}
                      {latest.suggestions.length > 0 && (
                        <Card className="border-zinc-800/80 bg-zinc-900/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm text-zinc-200">
                              <Info className="h-4 w-4 text-zinc-400" />
                              Optimization Suggestions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {latest.suggestions.map((s, i) => (
                                <div key={i} className="flex items-center justify-between rounded-md bg-zinc-800/30 p-2.5">
                                  <span className="text-xs text-zinc-300">{s.message}</span>
                                  <span className="shrink-0 font-mono text-xs text-emerald-400">-${s.estimatedMonthlySavingsUsd.toFixed(2)}/mo</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  );
                })()
              )}
            </TabsContent>

            {/* ── Observability Tab ── */}
            <TabsContent value="observability" className="space-y-4">
              {observability.isLoading ? (
                <ChartSkeleton />
              ) : !observability.data || observability.data.latestMetrics.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No observability data"
                  description="Metrics and incidents will appear here after deployments"
                />
              ) : (
                <>
                  {/* Metrics chart */}
                  <Card className="border-zinc-800/80 bg-zinc-900/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-zinc-200">Resource Usage (24h)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={observability.data.latestMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis
                            dataKey="ts"
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          />
                          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px', color: '#fafafa' }}
                            labelFormatter={(v) => new Date(v).toLocaleString()}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                          <Area type="monotone" dataKey="cpuPct" name="CPU %" stroke="#6366f1" fillOpacity={1} fill="url(#cpuGrad)" strokeWidth={1.5} />
                          <Area type="monotone" dataKey="memMb" name="Memory MB" stroke="#22c55e" fillOpacity={1} fill="url(#memGrad)" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Incidents */}
                  {observability.data.incidents.length > 0 && (
                    <Card className="border-zinc-800/80 bg-zinc-900/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          Related Incidents
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {observability.data.incidents.map((inc) => (
                            <div key={inc.id} className="flex items-center justify-between rounded-md border border-zinc-800/50 bg-zinc-950/50 p-3">
                              <div>
                                <div className="text-sm font-medium text-zinc-200">{inc.title}</div>
                                <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{inc.summary}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={inc.severity} />
                                <StatusBadge status={inc.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Trigger Rollout Dialog */}
      <Dialog open={showTriggerDialog} onOpenChange={setShowTriggerDialog}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Trigger Rollout</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Deploy the latest version of {svc?.name ?? 'this service'} to an environment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-300">Target Environment</label>
            <Select value={targetEnv} onValueChange={setTargetEnv}>
              <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                <SelectItem value="DEV">DEV</SelectItem>
                <SelectItem value="STAGING">STAGING</SelectItem>
                <SelectItem value="PROD">PROD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTriggerDialog(false)} className="text-zinc-400">Cancel</Button>
            <Button
              onClick={handleTrigger}
              disabled={triggerRollout.isPending}
              className="bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {triggerRollout.isPending ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Deploying...</>
              ) : (
                <><Rocket className="mr-1.5 h-3.5 w-3.5" /> Deploy</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function getLanguage(kind: string): string {
  switch (kind) {
    case 'DOCKERFILE': return 'dockerfile';
    case 'K8S_MANIFEST': return 'yaml';
    case 'HELM_VALUES': return 'yaml';
    case 'CI_PIPELINE': return 'yaml';
    case 'ARGO_APP': return 'yaml';
    default: return 'text';
  }
}
