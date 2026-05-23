import { Module } from '@nestjs/common';

/**
 * Day-3 deliverable. The headline feature — renders the Handlebars
 * templates from @forgeops/templates into Dockerfile / K8s / Helm / CI /
 * ArgoCD artifact bundles and persists them as `Artifact` rows under the
 * provided `ServiceVersion`.
 *
 * Sub-generators (one per ArtifactKind) are pure functions to keep them
 * trivially unit-testable.
 */
@Module({})
export class GeneratorModule {}
