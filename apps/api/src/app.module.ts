import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { validateEnv } from './config/env.schema';
import { PrismaModule } from './prisma/prisma.module';

// Guards & interceptors
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { WorkspaceGuard } from './common/guards/workspace.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

// Pluggable provider modules (mock ↔ real seam)
import { RolloutProviderModule } from './providers/rollout/rollout.module';
import { SecurityProviderModule } from './providers/security/security.module';
import { MetricsProviderModule } from './providers/metrics/metrics.module';
import { LogsProviderModule } from './providers/logs/logs.module';
import { ArtifactPublisherModule } from './providers/artifact-publisher/artifact-publisher.module';
import { AiProviderModule } from './providers/ai/ai-provider.module';

// Domain modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ServicesModule } from './modules/services/services.module';
import { GeneratorModule } from './modules/generator/generator.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { SecurityModule } from './modules/security/security.module';
import { CostModule } from './modules/cost/cost.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { AiModule } from './modules/ai/ai.module';
import { QueuesModule } from './modules/queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('nodeEnv') === 'production' ? 'info' : 'debug',
          transport:
            config.get('nodeEnv') !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
        },
      }),
    }),
    PrismaModule,

    // Provider modules
    RolloutProviderModule,
    SecurityProviderModule,
    MetricsProviderModule,
    LogsProviderModule,
    ArtifactPublisherModule,
    AiProviderModule,

    // Domain modules — Day 2 deliverables
    AuthModule,
    UsersModule,
    WorkspacesModule,
    AuditModule,

    // Other domain modules (stubs for now)
    TemplatesModule,
    ServicesModule,
    GeneratorModule,
    DeploymentsModule,
    SecurityModule,
    CostModule,
    ObservabilityModule,
    AiModule,
    QueuesModule,

    // Utility modules
    HealthModule,
    FeatureFlagsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: WorkspaceGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
