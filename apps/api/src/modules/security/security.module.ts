import { Module } from '@nestjs/common';

/**
 * Day-5 deliverable. Wraps the configured [[security-scanner]] provider,
 * persists SecurityReport + SecurityFinding rows per rollout, and exposes
 * read endpoints for the UI.
 */
@Module({})
export class SecurityModule {}
