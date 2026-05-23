import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ARTIFACT_PUBLISHER } from './artifact-publisher.interface';
import { DbArtifactPublisher } from './db-artifact-publisher';

@Module({
  providers: [
    DbArtifactPublisher,
    {
      provide: ARTIFACT_PUBLISHER,
      inject: [ConfigService, DbArtifactPublisher],
      useFactory: (config: ConfigService, db: DbArtifactPublisher) => {
        const choice = config.get<string>('providers.artifactPublisher', 'db');
        switch (choice) {
          case 'db':
            return db;
          case 'git':
            throw new Error('GitArtifactPublisher is not implemented yet.');
          default:
            throw new Error(`Unknown PROVIDER_ARTIFACT_PUBLISHER value: ${choice}`);
        }
      },
    },
  ],
  exports: [ARTIFACT_PUBLISHER],
})
export class ArtifactPublisherModule {}
