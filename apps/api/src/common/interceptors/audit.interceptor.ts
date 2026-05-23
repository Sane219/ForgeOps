import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap, type Observable } from 'rxjs';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { AuditService } from '../../modules/audit/audit.service';
import type { ForgeOpsRequest } from '../types/request';
import type { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<AuditAction | undefined>(AUDIT_KEY, context.getHandler());
    if (!action) return next.handle();

    const req = context.switchToHttp().getRequest<ForgeOpsRequest>();

    return next.handle().pipe(
      tap(() => {
        if (req.workspace?.id) {
          this.auditService.record({
            workspaceId: req.workspace.id,
            actorId: req.user?.id,
            action,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          }).catch((err) => this.logger.error('Audit write failed', err));
        }
      }),
    );
  }
}
