import { Module } from '@nestjs/common';

/**
 * Metrics + incidents land Day 5; logs land Day 9. Wraps the configured
 * [[metrics-provider]] and [[logs-provider]] adapters.
 */
@Module({})
export class ObservabilityModule {}
