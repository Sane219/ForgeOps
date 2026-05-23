import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TemplatesService } from './templates.service';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all available service templates' })
  list() {
    return this.templates.list();
  }

  @Public()
  @Get(':key')
  @ApiOperation({ summary: 'Get a template by key' })
  getByKey(@Param('key') key: string) {
    return this.templates.getByKey(key);
  }
}
