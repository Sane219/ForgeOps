import { Injectable, NotFoundException } from '@nestjs/common';
import { templateRegistry, getTemplate } from '@forgeops/templates';
import type { TemplateDefinition } from '@forgeops/templates';

@Injectable()
export class TemplatesService {
  list(): TemplateDefinition[] {
    return templateRegistry;
  }

  getByKey(key: string): TemplateDefinition {
    const template = getTemplate(key);
    if (!template) {
      throw new NotFoundException(`Template "${key}" not found`);
    }
    return template;
  }
}
