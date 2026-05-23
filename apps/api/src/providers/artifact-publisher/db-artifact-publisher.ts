import { Injectable } from '@nestjs/common';
import type {
  ArtifactPublisher,
  PublishInput,
  PublishResult,
} from './artifact-publisher.interface';

/**
 * MVP default. Artifacts are already persisted to the `artifacts` table by
 * the GeneratorService; this publisher just records the publish event.
 * A future GitArtifactPublisher would commit + push the bundle to a
 * GitOps config repo so ArgoCD can sync it.
 */
@Injectable()
export class DbArtifactPublisher implements ArtifactPublisher {
  async publish(input: PublishInput): Promise<PublishResult> {
    return {
      publisher: 'db',
      reference: input.serviceVersionId,
    };
  }
}
