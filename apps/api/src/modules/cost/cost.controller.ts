import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import type { WorkspaceContext } from '../../common/types/request';
import { CostService } from './cost.service';

@ApiTags('cost')
@ApiCookieAuth()
@Controller()
export class CostController {
  constructor(private readonly cost: CostService) {}

  @Post('cost/estimate')
  @ApiOperation({ summary: 'Stateless cost estimate for what-if scenarios' })
  estimate(@Body() input: { replicas: number; cpuMillicores: number; memoryMb: number; egressGbPerMonth?: number; storageGb?: number }) {
    return this.cost.estimate({
      replicas: input.replicas,
      cpuMillicores: input.cpuMillicores,
      memoryMb: input.memoryMb,
      egressGbPerMonth: input.egressGbPerMonth ?? 50,
      storageGb: input.storageGb ?? 10,
    });
  }

  @Get('services/:id/cost')
  @ApiOperation({ summary: 'Get cost estimates for all rollouts of a service' })
  getByService(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.cost.getByServiceId(id, ws.id);
  }

  @Get('rollouts/:id/cost')
  @ApiOperation({ summary: 'Get cost estimate for a specific rollout' })
  getByRollout(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.cost.getByRolloutId(id, ws.id);
  }
}
