import { z } from 'zod';

export const aiSubjectKindEnum = z.enum(['ROLLOUT', 'INCIDENT', 'CONFIG', 'SERVICE']);
export type AiSubjectKind = z.infer<typeof aiSubjectKindEnum>;

export const aiAnalyzeSchema = z.object({
  subjectKind: aiSubjectKindEnum,
  subjectId: z.string().min(1),
});
export type AiAnalyzeRequest = z.infer<typeof aiAnalyzeSchema>;

export const aiChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(8000),
});
export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

export const aiChatSchema = z.object({
  messages: z.array(aiChatMessageSchema).min(1).max(40),
  contextRefs: z
    .array(
      z.object({
        kind: z.enum(['SERVICE', 'ROLLOUT', 'INCIDENT']),
        id: z.string(),
      }),
    )
    .max(5)
    .optional(),
});
export type AiChatRequest = z.infer<typeof aiChatSchema>;

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
  createdAt: string;
}
