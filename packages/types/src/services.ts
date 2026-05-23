import { z } from 'zod';
import { Runtime } from './enums';
import { envVarSchema, slugSchema } from './common';

export const serviceConfigSchema = z.object({
  replicas: z.number().int().min(1).max(50).default(2),
  cpuMillicores: z.number().int().min(50).max(8000).default(500),
  memoryMb: z.number().int().min(64).max(16384).default(512),
  port: z.number().int().min(1).max(65535).default(3000),
  healthcheckPath: z.string().default('/healthz'),
  envVars: z.array(envVarSchema).default([]),
});
export type ServiceConfig = z.infer<typeof serviceConfigSchema>;

export const runtimeEnum = z.enum([
  Runtime.NEXTJS,
  Runtime.NESTJS,
  Runtime.FASTAPI,
  Runtime.PYTHON_WORKER,
  Runtime.GO_SERVICE,
  Runtime.STATIC,
]);

export const createServiceSchema = serviceConfigSchema.extend({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  description: z.string().max(500).optional(),
  templateKey: z.string().min(1).max(64),
  runtime: runtimeEnum,
  repoUrl: z.string().url().optional(),
  ownerId: z.string().optional(),
  tags: z.array(z.string().min(1).max(48)).max(10).default([]),
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = serviceConfigSchema.partial().extend({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  repoUrl: z.string().url().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  tags: z.array(z.string().min(1).max(48)).max(10).optional(),
  notes: z.string().max(500).optional(),
});
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export interface ServiceSummary {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  runtime: Runtime;
  templateKey: string;
  ownerId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  latestVersion: number;
}
