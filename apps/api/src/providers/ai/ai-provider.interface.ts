export type AiSubjectKind = 'ROLLOUT' | 'INCIDENT' | 'CONFIG' | 'SERVICE';

export interface AiSubject {
  kind: AiSubjectKind;
  id: string;
}

export interface AiRootCause {
  title: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string[];
}

export interface AiRecommendation {
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
}

export interface AiAnalysisResult {
  summary: string;
  rootCauses: AiRootCause[];
  recommendations: AiRecommendation[];
  modelUsed: string;
  providerName: 'deterministic' | 'claude';
}

export interface AiAnalyzeInput {
  subject: AiSubject;
  context: {
    service?: unknown;
    rollout?: unknown;
    incident?: unknown;
    metrics?: unknown;
    logs?: unknown;
    findings?: unknown;
  };
}

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiProvider {
  readonly name: 'deterministic' | 'claude';
  analyze(input: AiAnalyzeInput): Promise<AiAnalysisResult>;
  chat(messages: AiChatMessage[]): AsyncIterable<string>;
}
