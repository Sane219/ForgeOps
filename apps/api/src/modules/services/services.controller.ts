import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser, WorkspaceContext } from '../../common/types/request';
import { GeneratorService } from '../generator/generator.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@ApiCookieAuth()
@Controller('services')
export class ServicesController {
  constructor(
    private readonly services: ServicesService,
    private readonly generator: GeneratorService,
  ) {}

  // ── POST /api/services ──────────────────────────────────────
  @Post()
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Audit(AuditAction.SERVICE_CREATED)
  @ApiOperation({ summary: 'Create a new service with initial version v1' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Body() dto: CreateServiceDto,
  ) {
    return this.services.create(user.id, ws.id, dto);
  }

  // ── GET /api/services ───────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all services in the current workspace' })
  list(@CurrentWorkspace() ws: WorkspaceContext) {
    return this.services.list(ws.id);
  }

  // ── GET /api/services/:id ───────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get service detail with latest version and artifacts' })
  getById(@CurrentWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.services.getById(ws.id, id);
  }

  // ── PATCH /api/services/:id ─────────────────────────────────
  @Patch(':id')
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Audit(AuditAction.SERVICE_UPDATED)
  @ApiOperation({ summary: 'Update service metadata' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.services.update(user.id, ws.id, id, dto);
  }

  // ── GET /api/services/:id/versions ──────────────────────────
  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions for a service' })
  listVersions(@CurrentWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.services.listVersions(ws.id, id);
  }

  // ── GET /api/services/:id/artifacts/latest ──────────────────
  @Get(':id/artifacts/latest')
  @ApiOperation({ summary: 'Get artifacts for the latest service version' })
  getLatestArtifacts(@CurrentWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.services.getLatestArtifacts(ws.id, id);
  }

  // ── POST /api/services/:id/generate ─────────────────────────
  @Post(':id/generate')
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Audit(AuditAction.ARTIFACTS_GENERATED)
  @ApiOperation({ summary: 'Generate artifacts for the latest service version' })
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.generator.generateForService(ws.id, id);
  }
}
