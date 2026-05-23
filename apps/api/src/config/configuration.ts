export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPort: parseInt(process.env.API_PORT ?? '4000', 10),
  webBaseUrl: process.env.WEB_BASE_URL ?? 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
    cookieDomain: process.env.COOKIE_DOMAIN ?? 'localhost',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  },
  features: {
    aiCopilotEnabled: process.env.FEATURE_AI_COPILOT_ENABLED === 'true',
  },
  providers: {
    rollout: process.env.PROVIDER_ROLLOUT ?? 'mock',
    security: process.env.PROVIDER_SECURITY ?? 'mock',
    metrics: process.env.PROVIDER_METRICS ?? 'mock',
    logs: process.env.PROVIDER_LOGS ?? 'mock',
    artifactPublisher: process.env.PROVIDER_ARTIFACT_PUBLISHER ?? 'db',
  },
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    modelDefault: process.env.AI_MODEL_DEFAULT ?? 'claude-sonnet-4-6',
    modelFast: process.env.AI_MODEL_FAST ?? 'claude-haiku-4-5-20251001',
  },
});
