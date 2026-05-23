import { SetMetadata } from '@nestjs/common';
import type { AuditAction } from '@prisma/client';

export const AUDIT_KEY = 'auditAction';
export const Audit = (action: AuditAction) => SetMetadata(AUDIT_KEY, action);
