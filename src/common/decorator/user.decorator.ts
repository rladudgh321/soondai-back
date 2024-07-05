import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    Logger.log(
      `User Decorator - Attached User: ${JSON.stringify(request.user)}`,
    );
    return request.user;
  },
);

export interface UserAfterAuth {
  id: string;
}
