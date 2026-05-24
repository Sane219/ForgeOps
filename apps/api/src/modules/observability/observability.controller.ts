import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import type { WorkspaceContext } from '../../common/types/request';
import { ObservabilityService } from './observability.service';

@ApiTags('observability')
@ApiCookieAuth()
@Controller()
export class ObservabilityController {
  constructor(private readonly observability: ObservabilityService) {}

  @Get('services/:id/observability')
  @ApiOperation({ summary: 'Aggregated observability for a service (metrics + incidents)' })
  getForService(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.observability.getForService(id, ws.id);
  }

  @Get('deployments/:id/metrics')
  @ApiOperation({ summary: 'Get metrics time series for a deployment' })
  getMetrics(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('stepSeconds') stepSeconds?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 3600000);
    const toDate = to ? new Date(to) : new Date();
    const step = stepSeconds ? parseInt(stepSeconds, 10) : 3600;
    return this.observability.getMetrics(id, ws.id, fromDate, toDate, step);
  }

  @Get('deployments/:id/logs')
  @ApiOperation({ summary: 'Get logs for a deployment' })
  getLogs(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('levels') levels?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.observability.getLogs(id, ws.id, {
      from: from ? new Date(from) : new Date(Date.now() - 24 * 3600000),
      to: to ? new Date(to) : new Date(),
      levels: levels ? (levels.split(',') as any[]) : undefined,
      search,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }

  @Get('incidents')
  @ApiOperation({ summary: 'List all incidents in workspace' })
  getIncidents(@CurrentWorkspace() ws: WorkspaceContext) {
    return this.observability.getIncidents(ws.id);
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Get a single incident by ID' })
  getIncident(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.observability.getIncident(id, ws.id);
  }
}
