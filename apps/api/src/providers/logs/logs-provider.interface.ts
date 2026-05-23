export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogQuery {
  deploymentId: string;
  from: Date;
  to: Date;
  levels?: LogLevel[];
  search?: string;
  limit?: number;
  cursor?: string;
}

export interface LogEntry {
  ts: Date;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

export interface LogPage {
  entries: LogEntry[];
  nextCursor?: string;
}

export const LOGS_PROVIDER = Symbol('LOGS_PROVIDER');

export interface LogsProvider {
  query(q: LogQuery): Promise<LogPage>;
}
