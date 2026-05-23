import { z } from 'zod';
import { AuditAction } from './enums';

export const auditQuerySchema = z.object({
  actorId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  subjectKind: z.string().optional(),
  subjectId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type AuditQueryInput = z.infer<typeof auditQuerySchema>;

export interface AuditEventSummary {
  id: string;
  workspaceId: string;
  actorId: string | null;
  actorName: string | null;
  action: AuditAction;
  subjectKind: string | null;
  subjectId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
