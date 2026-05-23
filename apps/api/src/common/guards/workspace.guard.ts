import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Day-2 deliverable. Resolves the active workspace from `x-workspace-slug`
 * (or path param), validates the current user's membership, and populates
 * `req.workspace = { id, slug, role }`.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO(day-2): resolve workspace + membership, attach to req
    return true;
  }
}
