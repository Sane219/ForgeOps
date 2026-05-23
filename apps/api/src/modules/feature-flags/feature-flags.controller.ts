import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';

/**
 * GET /api/feature-flags — read by the web app on bootstrap to decide
 * whether to render the AI copilot surfaces. Always public so the
 * unauthenticated landing/login pages can also adapt.
 */
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get()
  get() {
    return {
      aiCopilot: this.config.get<boolean>('features.aiCopilotEnabled', false),
    };
  }
}
