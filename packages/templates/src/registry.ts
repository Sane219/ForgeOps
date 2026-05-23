import { Runtime } from '@forgeops/types';

export interface TemplateDefinition {
  key: string;
  name: string;
  description: string;
  runtime: Runtime;
  iconKey: string;
  defaultPort: number;
  defaultHealthcheckPath: string;
  defaultEnvVars: Array<{ key: string; value: string; secret: boolean }>;
  /** Filesystem path under packages/templates/templates/ containing Handlebars bodies. */
  templateDir: string;
}

/**
 * The template registry. Bodies live under packages/templates/templates/<key>/
 * and are rendered by the Handlebars-based GeneratorModule in apps/api.
 *
 * Real template bodies land Day 3. This Day-1 registry pins the contract so
 * the generator service and catalog UI can be built against a stable shape.
 */
export const templateRegistry: TemplateDefinition[] = [
  {
    key: 'nextjs-app',
    name: 'Next.js App',
    description: 'Production-ready Next.js 15 application with TypeScript and Tailwind.',
    runtime: Runtime.NEXTJS,
    iconKey: 'globe',
    defaultPort: 3000,
    defaultHealthcheckPath: '/api/health',
    defaultEnvVars: [{ key: 'NEXT_TELEMETRY_DISABLED', value: '1', secret: false }],
    templateDir: 'nextjs-app',
  },
  {
    key: 'nestjs-api',
    name: 'NestJS API',
    description: 'NestJS HTTP API with Pino logging, Swagger, and a /healthz endpoint.',
    runtime: Runtime.NESTJS,
    iconKey: 'server',
    defaultPort: 4000,
    defaultHealthcheckPath: '/healthz',
    defaultEnvVars: [],
    templateDir: 'nestjs-api',
  },
  {
    key: 'fastapi-service',
    name: 'Python FastAPI',
    description: 'FastAPI service with Uvicorn, structured logging, and /healthz.',
    runtime: Runtime.FASTAPI,
    iconKey: 'zap',
    defaultPort: 8000,
    defaultHealthcheckPath: '/healthz',
    defaultEnvVars: [],
    templateDir: 'fastapi-service',
  },
  {
    key: 'python-worker',
    name: 'Python Worker',
    description: 'Headless Python worker for queue consumption or scheduled jobs.',
    runtime: Runtime.PYTHON_WORKER,
    iconKey: 'cpu',
    defaultPort: 0,
    defaultHealthcheckPath: '',
    defaultEnvVars: [],
    templateDir: 'python-worker',
  },
  {
    key: 'go-service',
    name: 'Go Service',
    description: 'Lightweight Go HTTP service with graceful shutdown and a health endpoint.',
    runtime: Runtime.GO_SERVICE,
    iconKey: 'rabbit',
    defaultPort: 8080,
    defaultHealthcheckPath: '/healthz',
    defaultEnvVars: [],
    templateDir: 'go-service',
  },
];

export function getTemplate(key: string): TemplateDefinition | undefined {
  return templateRegistry.find((t) => t.key === key);
}
