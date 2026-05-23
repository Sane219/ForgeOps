import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction, Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser, WorkspaceContext } from '../../common/types/request';
import { TriggerRolloutDto } from './dto/trigger-rollout.dto';
import { DeploymentsService } from './deployments.service';

@ApiTags('deployments')
@ApiCookieAuth()
@Controller()
export class DeploymentsController {
  constructor(private readonly deployments: DeploymentsService) {}

  // ── GET /api/deployments ────────────────────────────────────
  @Get('deployments')
  @ApiOperation({ summary: 'List all deployments in the current workspace' })
  listAll(@CurrentWorkspace() ws: WorkspaceContext) {
    return this.deployments.listForWorkspace(ws.id);
  }

  // ── GET /api/services/:serviceId/deployments ────────────────
  @Get('services/:serviceId/deployments')
  @ApiOperation({ summary: 'List deployments for a service across environments' })
  listForService(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('serviceId') serviceId: string,
  ) {
    return this.deployments.listForService(ws.id, serviceId);
  }

  // ── POST /api/services/:serviceId/deployments ───────────────
  @Post('services/:serviceId/deployments')
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Audit(AuditAction.DEPLOYMENT_TRIGGERED)
  @ApiOperation({ summary: 'Trigger a rollout for a service to a target environment' })
  trigger(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('serviceId') serviceId: string,
    @Body() dto: TriggerRolloutDto,
  ) {
    return this.deployments.triggerRollout(user.id, ws.id, serviceId, dto);
  }

  // ── GET /api/deployments/:id/rollouts ───────────────────────
  @Get('deployments/:id/rollouts')
  @ApiOperation({ summary: 'List rollout history for a deployment' })
  listRollouts(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.deployments.listRollouts(ws.id, id);
  }

  // ── POST /api/deployments/:id/rollback ──────────────────────
  @Post('deployments/:id/rollback')
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Audit(AuditAction.ROLLBACK_REQUESTED)
  @ApiOperation({ summary: 'Rollback to the last succeeded version' })
  rollback(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.deployments.rollback(user.id, ws.id, id);
  }
}
