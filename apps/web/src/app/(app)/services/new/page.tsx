'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTemplates, type TemplateSummary } from '@/hooks/use-templates';
import { useCreateService } from '@/hooks/use-services';
import { PageHeader } from '@/components/page-header';
import { WizardShell } from '@/components/wizard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Globe,
  Server,
  Zap,
  Cpu,
  Rabbit,
  Check,
  Info,
} from 'lucide-react';

const RUNTIME_LABELS: Record<string, string> = {
  NEXTJS: 'Next.js',
  NESTJS: 'NestJS',
  FASTAPI: 'FastAPI',
  PYTHON_WORKER: 'Python Worker',
  GO_SERVICE: 'Go',
  STATIC: 'Static',
};

const RUNTIME_COLORS: Record<string, string> = {
  NEXTJS: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  NESTJS: 'bg-red-500/10 text-red-400 ring-red-500/20',
  FASTAPI: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  PYTHON_WORKER: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  GO_SERVICE: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
  STATIC: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }> | undefined> = {
  globe: Globe,
  server: Server,
  zap: Zap,
  cpu: Cpu,
  rabbit: Rabbit,
};

const basicsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  slug: z.string().min(1, 'Slug is required').max(64).regex(/^[a-z0-9-]+$/, 'Lowercase kebab-case only'),
  description: z.string().max(500).optional(),
});

type BasicsInput = z.infer<typeof basicsSchema>;

const STEPS = [
  { label: 'Template', description: 'Choose a template' },
  { label: 'Basics', description: 'Name and describe your service' },
  { label: 'Configuration', description: 'Review default config' },
  { label: 'Review', description: 'Confirm and create' },
];

export default function NewServicePage() {
  const router = useRouter();
  const { data: templates, isLoading } = useTemplates();
  const createService = useCreateService();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSummary | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BasicsInput>({
    resolver: zodResolver(basicsSchema),
    defaultValues: { name: '', slug: '', description: '' },
  });

  const nameValue = watch('name');
  const slugValue = watch('slug');

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    if (!slugValue || slugValue === slugify(nameValue)) {
      setValue('slug', slugify(name));
    }
  };

  const canProceed = useMemo(() => {
    if (currentStep === 0) return !!selectedTemplate;
    if (currentStep === 1) return !errors.name && !errors.slug && nameValue?.length > 0;
    return true;
  }, [currentStep, selectedTemplate, errors, nameValue]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = handleSubmit((data) => {
    if (!selectedTemplate) return;

    createService.mutate(
      {
        name: data.name,
        slug: data.slug,
        templateKey: selectedTemplate.key,
        description: data.description || undefined,
      },
      {
        onSuccess: (service) => {
          router.push(`/app/services/${service.id}`);
        },
      },
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Service"
        description="Scaffold a new service from a template"
      />

      <WizardShell
        steps={STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleCreate}
        isSubmitting={createService.isPending}
        isNextDisabled={!canProceed}
        submitLabel="Create Service"
      >
        {/* Step 1: Template Selection */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Choose a template to scaffold your service. Each template includes a Dockerfile,
              Kubernetes manifests, Helm values, CI pipeline, and ArgoCD application.
            </p>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-36 animate-pulse rounded-lg bg-zinc-800/40" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(templates ?? []).map((t) => {
                  const Icon = ICON_MAP[t.iconKey as keyof typeof ICON_MAP] ?? Globe;
                  const isSelected = selectedTemplate?.key === t.key;

                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setSelectedTemplate(t)}
                      className={cn(
                        'flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all',
                        isSelected
                          ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/20'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/30',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-md ring-1',
                          RUNTIME_COLORS[t.runtime] ?? 'bg-zinc-800 text-zinc-400 ring-zinc-700',
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-100">{t.name}</div>
                          <Badge variant="secondary" className="mt-0.5 bg-zinc-800 text-[10px] text-zinc-400">
                            {RUNTIME_LABELS[t.runtime] ?? t.runtime}
                          </Badge>
                        </div>
                        {isSelected && (
                          <Check className="ml-auto h-4 w-4 text-indigo-400" />
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-500">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Basics */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-zinc-300">Service Name</Label>
              <Input
                id="name"
                placeholder="acme-api"
                className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
                {...register('name', { onChange: handleNameChange })}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-zinc-300">Slug</Label>
              <Input
                id="slug"
                placeholder="acme-api"
                className="border-zinc-800 bg-zinc-950 font-mono text-zinc-100 placeholder:text-zinc-600"
                {...register('slug')}
              />
              {errors.slug && <p className="text-xs text-red-400">{errors.slug.message}</p>}
              <p className="text-[11px] text-zinc-600">Lowercase kebab-case. Used in URLs and deployment names.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-zinc-300">Description</Label>
              <textarea
                id="description"
                placeholder="Core REST API for the platform"
                className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Configuration (display-only) */}
        {currentStep === 2 && selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md bg-zinc-900 p-3 ring-1 ring-zinc-800">
              <Info className="h-4 w-4 text-zinc-500" />
              <p className="text-xs text-zinc-400">
                These defaults are set by the <span className="font-medium text-zinc-300">{selectedTemplate.name}</span> template.
                You can customize them after creation.
              </p>
            </div>

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <ConfigItem label="Replicas" value="2" />
                  <ConfigItem label="CPU" value="500m" />
                  <ConfigItem label="Memory" value="512Mi" />
                  <ConfigItem label="Port" value={String(selectedTemplate.defaultPort)} />
                  <ConfigItem label="Health Check" value={selectedTemplate.defaultHealthcheckPath || 'None'} />
                  <ConfigItem label="Runtime" value={RUNTIME_LABELS[selectedTemplate.runtime] ?? selectedTemplate.runtime} />
                </div>

                {selectedTemplate.defaultEnvVars.length > 0 && (
                  <>
                    <Separator className="bg-zinc-800" />
                    <div>
                      <h4 className="text-xs font-medium text-zinc-400">Environment Variables</h4>
                      <div className="mt-2 space-y-1">
                        {selectedTemplate.defaultEnvVars.map((v, i) => (
                          <div key={i} className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-zinc-300">{v.key}</span>
                            <span className="text-zinc-600">=</span>
                            <span className="text-zinc-500">{v.secret ? '••••••••' : v.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Review & Create */}
        {currentStep === 3 && selectedTemplate && (
          <div className="space-y-4">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg ring-1',
                    RUNTIME_COLORS[selectedTemplate.runtime] ?? 'bg-zinc-800 text-zinc-400 ring-zinc-700',
                  )}>
                    {(() => { const I = ICON_MAP[selectedTemplate.iconKey] ?? Globe; return <I className="h-5 w-5" />; })()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-100">{nameValue || 'Untitled'}</div>
                    <div className="text-xs text-zinc-500">{slugValue || 'no-slug'}</div>
                  </div>
                </div>

                <Separator className="bg-zinc-800" />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-zinc-500">Template:</span> <span className="text-zinc-300">{selectedTemplate.name}</span></div>
                  <div><span className="text-zinc-500">Runtime:</span> <span className="text-zinc-300">{RUNTIME_LABELS[selectedTemplate.runtime]}</span></div>
                  <div className="col-span-2"><span className="text-zinc-500">Description:</span> <span className="text-zinc-300">{watch('description') || '—'}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </WizardShell>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">{label}</div>
      <div className="mt-0.5 font-mono text-sm text-zinc-200">{value}</div>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
