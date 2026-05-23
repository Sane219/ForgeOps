import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { validateEnv } from './config/env.schema';
import { PrismaModule } from './prisma/prisma.module';

// Pluggable provider modules (mock ↔ real seam)
import { RolloutProviderModule } from './providers/rollout/rollout.module';
import { SecurityProviderModule } from './providers/security/security.module';
import { MetricsProviderModule } from './providers/metrics/metrics.module';
import { LogsProviderModule } from './providers/logs/logs.module';
import { ArtifactPublisherModule } from './providers/artifact-publisher/artifact-publisher.module';
import { AiProviderModule } from './providers/ai/ai-provider.module';

// Domain modules — implementations land Days 2–9
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ServicesModule } from './modules/services/services.module';
import { GeneratorModule } from './modules/generator/generator.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { SecurityModule } from './modules/security/security.module';
import { CostModule } from './modules/cost/cost.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { AuditModule } from './modules/audit/audit.module';
import { AiModule } from './modules/ai/ai.module';
import { QueuesModule } from './modules/queues/queues.module';
import { HealthModule } from './modules/health/health.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    PrismaModule,

    // Provider registry — see apps/api/src/providers/README.md
    RolloutProviderModule,
    SecurityProviderModule,
    MetricsProviderModule,
    LogsProviderModule,
    ArtifactPublisherModule,
    AiProviderModule,

    // Domain
    HealthModule,
    FeatureFlagsModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    TemplatesModule,
    ServicesModule,
    GeneratorModule,
    DeploymentsModule,
    SecurityModule,
    CostModule,
    ObservabilityModule,
    AuditModule,
    AiModule,
    QueuesModule,
  ],
})
export class AppModule {}
