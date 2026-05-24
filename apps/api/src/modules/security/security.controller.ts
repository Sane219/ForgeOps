import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import type { WorkspaceContext } from '../../common/types/request';
import { SecurityService } from './security.service';

@ApiTags('security')
@ApiCookieAuth()
@Controller()
export class SecurityController {
  constructor(private readonly security: SecurityService) {}

  @Get('services/:id/security')
  @ApiOperation({ summary: 'Get security reports for all rollouts of a service' })
  getByService(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.security.getByServiceId(id, ws.id);
  }

  @Get('rollouts/:id/security')
  @ApiOperation({ summary: 'Get security report for a specific rollout' })
  getByRollout(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.security.getByRolloutId(id, ws.id);
  }

  @Post('rollouts/:id/security/rescan')
  @ApiOperation({ summary: 'Re-run security scan on a rollout' })
  rescan(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.security.rescan(id, ws.id);
  }
}
