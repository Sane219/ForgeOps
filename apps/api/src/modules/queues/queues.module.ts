import { Module, OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';
import { RolloutProcessor } from './processors/rollout.processor';
import { SecurityModule } from '../security/security.module';
import { CostModule } from '../cost/cost.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [SecurityModule, CostModule, ObservabilityModule],
  controllers: [QueuesController],
  providers: [QueuesService, RolloutProcessor],
  exports: [QueuesService],
})
export class QueuesModule implements OnModuleInit {
  private readonly logger = new Logger(QueuesModule.name);

  constructor(private readonly rolloutProcessor: RolloutProcessor) {}

  onModuleInit() {
    this.rolloutProcessor.start();
    this.logger.log('BullMQ workers started');
  }
}
