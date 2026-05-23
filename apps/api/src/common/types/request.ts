import type { Request } from 'express';
import type { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

export interface WorkspaceContext {
  id: string;
  slug: string;
  role: Role;
}

export interface ForgeOpsRequest extends Request {
  user?: AuthenticatedUser;
  workspace?: WorkspaceContext;
}
