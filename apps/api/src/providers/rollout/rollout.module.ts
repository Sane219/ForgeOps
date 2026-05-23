import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockRolloutDriver } from './mock-rollout.driver';
import { ROLLOUT_DRIVER } from './rollout-driver.interface';

@Module({
  providers: [
    MockRolloutDriver,
    {
      provide: ROLLOUT_DRIVER,
      inject: [ConfigService, MockRolloutDriver],
      useFactory: (config: ConfigService, mock: MockRolloutDriver) => {
        const choice = config.get<string>('providers.rollout', 'mock');
        switch (choice) {
          case 'mock':
            return mock;
          case 'kubernetes':
            throw new Error(
              'KubernetesRolloutDriver is not implemented yet (see kubernetes-rollout.driver.stub.ts).',
            );
          default:
            throw new Error(`Unknown PROVIDER_ROLLOUT value: ${choice}`);
        }
      },
    },
  ],
  exports: [ROLLOUT_DRIVER],
})
export class RolloutProviderModule {}
