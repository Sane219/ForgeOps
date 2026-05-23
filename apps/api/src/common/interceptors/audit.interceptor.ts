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

/**
 * Reads `@Audit(action)` metadata from the handler and writes an audit
 * event on successful completion. Full implementation lands Day 2 once
 * the AuditService exists.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<string | undefined>(AUDIT_KEY, context.getHandler());
    return next.handle().pipe(
      tap(() => {
        if (action) {
          this.logger.debug(`[audit] ${action} (write deferred to Day 2 AuditService)`);
        }
      }),
    );
  }
}
