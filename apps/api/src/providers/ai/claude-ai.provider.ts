import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiAnalysisResult,
  AiAnalyzeInput,
  AiChatMessage,
  AiProvider,
} from './ai-provider.interface';

/**
 * Claude-backed provider. Selected only when:
 *   FEATURE_AI_COPILOT_ENABLED=true  AND  ANTHROPIC_API_KEY is set.
 *
 * Day-9 deliverable will implement:
 *   - Anthropic SDK with prompt caching for the system prompt + context
 *   - Structured JSON output via tools for analyze()
 *   - Server-sent-events streaming for chat()
 */
@Injectable()
export class ClaudeAiProvider implements AiProvider {
  readonly name = 'claude' as const;
  private readonly logger = new Logger(ClaudeAiProvider.name);

  constructor(private readonly config: ConfigService) {
    this.logger.log(
      `ClaudeAiProvider constructed (model=${config.get<string>('ai.modelDefault')}). Implementation lands Day 9.`,
    );
  }

  async analyze(_input: AiAnalyzeInput): Promise<AiAnalysisResult> {
    throw new Error('ClaudeAiProvider.analyze() not implemented (Day 9).');
  }

  async *chat(_messages: AiChatMessage[]): AsyncIterable<string> {
    throw new Error('ClaudeAiProvider.chat() not implemented (Day 9).');
  }
}
