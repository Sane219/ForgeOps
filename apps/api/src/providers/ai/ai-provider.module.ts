import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './ai-provider.interface';
import { ClaudeAiProvider } from './claude-ai.provider';
import { DeterministicAiProvider } from './deterministic-ai.provider';

@Module({
  providers: [
    DeterministicAiProvider,
    ClaudeAiProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, DeterministicAiProvider, ClaudeAiProvider],
      useFactory: (
        config: ConfigService,
        deterministic: DeterministicAiProvider,
        claude: ClaudeAiProvider,
      ) => {
        const flag = config.get<boolean>('features.aiCopilotEnabled', false);
        const key = config.get<string>('ai.anthropicApiKey', '');
        return flag && key.length > 0 ? claude : deterministic;
      },
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiProviderModule {}
