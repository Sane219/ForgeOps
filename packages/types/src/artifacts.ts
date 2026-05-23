import { z } from 'zod';
import { ArtifactKind } from './enums';

export const artifactKindEnum = z.enum([
  ArtifactKind.DOCKERFILE,
  ArtifactKind.K8S_MANIFEST,
  ArtifactKind.HELM_VALUES,
  ArtifactKind.CI_PIPELINE,
  ArtifactKind.ARGO_APP,
]);

export interface ArtifactSummary {
  id: string;
  serviceVersionId: string;
  kind: ArtifactKind;
  filename: string;
  contentType: string;
  checksum: string;
  generatorVersion: string;
  createdAt: string;
}

export interface ArtifactDetail extends ArtifactSummary {
  content: string;
}

export interface ArtifactBundle {
  serviceVersionId: string;
  artifacts: ArtifactSummary[];
}
