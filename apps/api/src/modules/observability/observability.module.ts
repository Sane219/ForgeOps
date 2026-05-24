import { Module } from '@nestjs/common';
import { MetricsProviderModule } from '../../providers/metrics/metrics.module';
import { LogsProviderModule } from '../../providers/logs/logs.module';
import { ObservabilityController } from './observability.controller';
import { ObservabilityService } from './observability.service';

/**
 * Day-5 deliverable. Metrics + incidents + logs. Wraps the configured
 * [[metrics-provider]] and [[logs-provider]] adapters, persists
 * MetricSample, LogEntry, and Incident rows tied to rollouts.
 */
@Module({
  imports: [MetricsProviderModule, LogsProviderModule],
  controllers: [ObservabilityController],
  providers: [ObservabilityService],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
