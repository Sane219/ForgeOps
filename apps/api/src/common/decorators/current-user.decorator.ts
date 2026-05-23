import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { ForgeOpsRequest } from '../types/request';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<ForgeOpsRequest>();
  return req.user;
});
