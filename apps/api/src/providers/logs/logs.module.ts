import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LOGS_PROVIDER } from './logs-provider.interface';
import { MockLogsProvider } from './mock-logs.provider';

@Module({
  providers: [
    MockLogsProvider,
    {
      provide: LOGS_PROVIDER,
      inject: [ConfigService, MockLogsProvider],
      useFactory: (config: ConfigService, mock: MockLogsProvider) => {
        const choice = config.get<string>('providers.logs', 'mock');
        switch (choice) {
          case 'mock':
            return mock;
          case 'loki':
            throw new Error('LokiLogsProvider is not implemented yet.');
          default:
            throw new Error(`Unknown PROVIDER_LOGS value: ${choice}`);
        }
      },
    },
  ],
  exports: [LOGS_PROVIDER],
})
export class LogsProviderModule {}
