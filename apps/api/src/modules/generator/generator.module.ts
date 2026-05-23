import { Module } from '@nestjs/common';
import { GeneratorService } from './generator.service';

/**
 * Artifact generation module. Renders Handlebars templates from
 * @forgeops/templates into Dockerfile / K8s / Helm / CI / ArgoCD
 * artifact bundles and persists them as Artifact rows.
 */
@Module({
  providers: [GeneratorService],
  exports: [GeneratorService],
})
export class GeneratorModule {}
