import { z } from 'zod';
import { Role } from './enums';
import { slugSchema } from './common';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  description: z.string().max(500).optional(),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum([Role.ADMIN, Role.DEVELOPER, Role.VIEWER]).default(Role.DEVELOPER),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum([Role.ADMIN, Role.DEVELOPER, Role.VIEWER]),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
