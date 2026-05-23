import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser, WorkspaceContext } from '../../common/types/request';
import { Role } from '@prisma/client';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiCookieAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace (auto-seeds DEV/STAGING/PROD environments)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: { name: string; slug: string; description?: string }) {
    return this.workspacesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List workspaces for current user' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.listForUser(user.id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get workspace detail by slug' })
  getBySlug(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.workspacesService.getBySlug(user.id, slug);
  }

  @Post(':slug/members')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Invite a member to the workspace by email' })
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('slug') _slug: string,
    @Body() dto: { email: string; role: Role },
  ) {
    return this.workspacesService.inviteMember(ws.id, user.id, dto);
  }

  @Patch(':slug/members/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Change a member\'s role' })
  updateRole(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('slug') _slug: string,
    @Param('userId') userId: string,
    @Body() dto: { role: Role },
  ) {
    return this.workspacesService.updateMemberRole(ws.id, user.id, userId, dto);
  }

  @Delete(':slug/members/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param('slug') _slug: string,
    @Param('userId') userId: string,
  ) {
    return this.workspacesService.removeMember(ws.id, user.id, userId);
  }
}
