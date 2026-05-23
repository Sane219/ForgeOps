import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    API_PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    WEB_BASE_URL: z.string().url().default('http://localhost:3000'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be ≥ 32 chars'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be ≥ 32 chars'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('30d'),
    COOKIE_DOMAIN: z.string().default('localhost'),
    COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
    FEATURE_AI_COPILOT_ENABLED: z.enum(['true', 'false']).default('false'),
    ANTHROPIC_API_KEY: z.string().optional().default(''),
    AI_MODEL_DEFAULT: z.string().default('claude-sonnet-4-6'),
    AI_MODEL_FAST: z.string().default('claude-haiku-4-5-20251001'),
    PROVIDER_ROLLOUT: z.enum(['mock', 'kubernetes']).default('mock'),
    PROVIDER_SECURITY: z.enum(['mock', 'trivy', 'snyk']).default('mock'),
    PROVIDER_METRICS: z.enum(['mock', 'prometheus']).default('mock'),
    PROVIDER_LOGS: z.enum(['mock', 'loki']).default('mock'),
    PROVIDER_ARTIFACT_PUBLISHER: z.enum(['db', 'git']).default('db'),
  })
  .passthrough();

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>) {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}
