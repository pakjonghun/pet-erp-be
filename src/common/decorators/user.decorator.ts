import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const isHttp = ctx.getType() === 'http';
    if (isHttp) {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    } else {
      const gqlCtx = GqlExecutionContext.create(ctx);
      return gqlCtx.getContext().req.user;
    }
  },
);
