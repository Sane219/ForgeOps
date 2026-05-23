import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { METRICS_PROVIDER } from './metrics-provider.interface';
import { MockMetricsProvider } from './mock-metrics.provider';

@Module({
  providers: [
    MockMetricsProvider,
    {
      provide: METRICS_PROVIDER,
      inject: [ConfigService, MockMetricsProvider],
      useFactory: (config: ConfigService, mock: MockMetricsProvider) => {
        const choice = config.get<string>('providers.metrics', 'mock');
        switch (choice) {
          case 'mock':
            return mock;
          case 'prometheus':
            throw new Error('PrometheusMetricsProvider is not implemented yet.');
          default:
            throw new Error(`Unknown PROVIDER_METRICS value: ${choice}`);
        }
      },
    },
  ],
  exports: [METRICS_PROVIDER],
})
export class MetricsProviderModule {}
