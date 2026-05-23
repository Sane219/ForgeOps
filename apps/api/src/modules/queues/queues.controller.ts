import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueuesService } from './queues.service';

@ApiTags('queues')
@ApiCookieAuth()
@Controller('queues')
export class QueuesController {
  constructor(private readonly queues: QueuesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get BullMQ queue statistics' })
  stats() {
    return this.queues.getQueueStats();
  }
}
