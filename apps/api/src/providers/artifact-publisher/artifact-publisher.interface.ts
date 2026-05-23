import type { Artifact } from '@prisma/client';

export interface PublishInput {
  serviceVersionId: string;
  workspaceSlug: string;
  serviceSlug: string;
  artifacts: Array<Pick<Artifact, 'kind' | 'filename' | 'content' | 'checksum'>>;
}

export interface PublishResult {
  publisher: string;
  reference: string;
}

/**
 * Port for "publishing" an artifact bundle outside the database.
 * MVP publisher writes to the DB only. A future GitArtifactPublisher
 * would push the bundle into a GitOps config repo (so Argo CD can sync).
 */
export const ARTIFACT_PUBLISHER = Symbol('ARTIFACT_PUBLISHER');

export interface ArtifactPublisher {
  publish(input: PublishInput): Promise<PublishResult>;
}
