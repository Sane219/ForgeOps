import { Module } from '@nestjs/common';
import { CostController } from './cost.controller';
import { CostService } from './cost.service';

/**
 * Day-5 deliverable. Pricing-table-driven cost calculator with
 * warnings/suggestions output. Also exposes a stateless
 * POST /api/cost/estimate that backs the what-if calculator in the UI.
 */
@Module({
  controllers: [CostController],
  providers: [CostService],
  exports: [CostService],
})
export class CostModule {}
