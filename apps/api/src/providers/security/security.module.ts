import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SECURITY_SCANNER } from './security-scanner.interface';
import { MockSecurityScanner } from './mock-security.scanner';

@Module({
  providers: [
    MockSecurityScanner,
    {
      provide: SECURITY_SCANNER,
      inject: [ConfigService, MockSecurityScanner],
      useFactory: (config: ConfigService, mock: MockSecurityScanner) => {
        const choice = config.get<string>('providers.security', 'mock');
        switch (choice) {
          case 'mock':
            return mock;
          case 'trivy':
          case 'snyk':
            throw new Error(`SecurityScanner "${choice}" is not implemented yet.`);
          default:
            throw new Error(`Unknown PROVIDER_SECURITY value: ${choice}`);
        }
      },
    },
  ],
  exports: [SECURITY_SCANNER],
})
export class SecurityProviderModule {}
