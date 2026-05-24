import { Module } from '@nestjs/common';
import { SecurityProviderModule } from '../../providers/security/security.module';
import { AuditModule } from '../audit/audit.module';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

/**
 * Day-5 deliverable. Wraps the configured [[security-scanner]] provider,
 * persists SecurityReport + SecurityFinding rows per rollout, and exposes
 * read endpoints for the UI.
 */
@Module({
  imports: [SecurityProviderModule, AuditModule],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
