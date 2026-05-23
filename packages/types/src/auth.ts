import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
  workspaceName: z.string().min(1).max(120),
  workspaceSlug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/, 'must be lowercase kebab-case'),
});
export type SignupInput = z.infer<typeof signupSchema>;

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface WorkspaceMembershipSummary {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  role: 'ADMIN' | 'DEVELOPER' | 'VIEWER';
}

export interface SessionResponse {
  user: SessionUser;
  memberships: WorkspaceMembershipSummary[];
}
