import { Injectable } from '@nestjs/common';
import type {
  LogPage,
  LogQuery,
  LogsProvider,
} from './logs-provider.interface';

/**
 * Day-9 deliverable: synthesized log lines correlated with the mock
 * rollouts and metrics — request logs, warning bursts during error-rate
 * spikes, stack-trace blocks on rollout failures. Day-1 skeleton: empty.
 */
@Injectable()
export class MockLogsProvider implements LogsProvider {
  async query(_q: LogQuery): Promise<LogPage> {
    return { entries: [] };
  }
}
