import { Module } from '@nestjs/common';

/**
 * Day-9 deliverable. Wraps the configured [[ai-provider]] (deterministic
 * by default; Claude when FEATURE_AI_COPILOT_ENABLED=true + ANTHROPIC_API_KEY
 * is set). Endpoints:
 *
 *   POST /api/ai/analyze    structured rollout/incident analysis
 *   POST /api/ai/chat       SSE-streamed copilot chat
 *   POST /api/ai/review     config review for a ServiceVersion
 */
@Module({})
export class AiModule {}
