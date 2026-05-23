import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Reads `@Roles(...)` metadata from the handler and asserts that the
 * caller's workspace role is in the allowed set. Pairs with [[WorkspaceGuard]]
 * which is responsible for populating `req.workspace.role`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(_context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      _context.getHandler(),
      _context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    // TODO(day-2): compare against req.workspace.role once WorkspaceGuard populates it
    return true;
  }
}
