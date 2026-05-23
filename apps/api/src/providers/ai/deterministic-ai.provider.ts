import { Injectable } from '@nestjs/common';
import type {
  AiAnalysisResult,
  AiAnalyzeInput,
  AiChatMessage,
  AiProvider,
} from './ai-provider.interface';

/**
 * Always-available rules-based provider. Produces believable analyses
 * without any external API key. Day-9 will flesh out the rule set to
 * correlate logs/metrics/findings with the service config and surface
 * known failure patterns. Day-1 skeleton just echoes the subject.
 *
 * Existence guarantee: this provider ships with the product so the AI
 * surfaces never crash when the feature flag is off.
 */
@Injectable()
export class DeterministicAiProvider implements AiProvider {
  readonly name = 'deterministic' as const;

  async analyze(input: AiAnalyzeInput): Promise<AiAnalysisResult> {
    return {
      summary: `Analysis for ${input.subject.kind} ${input.subject.id} is not yet implemented (deterministic provider stub).`,
      rootCauses: [],
      recommendations: [],
      modelUsed: 'deterministic-v0',
      providerName: 'deterministic',
    };
  }

  async *chat(messages: AiChatMessage[]): AsyncIterable<string> {
    const last = messages[messages.length - 1]?.content ?? '';
    yield `(deterministic copilot) Received "${last.slice(0, 200)}". Enable FEATURE_AI_COPILOT_ENABLED and set ANTHROPIC_API_KEY for the full chat experience.`;
  }
}
