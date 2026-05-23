import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { ForgeOpsRequest } from '../types/request';

export const CurrentWorkspace = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<ForgeOpsRequest>();
  return req.workspace;
});
