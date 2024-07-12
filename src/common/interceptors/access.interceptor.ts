import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { User, UserRoleEnum } from 'src/users/entities/user.entity';
import * as requestIp from 'request-ip';

@Injectable()
export class AccessInterceptor implements NestInterceptor {
  constructor() {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const isHttp = context.getType() === 'http';
    const request = isHttp
      ? context.switchToHttp().getRequest<Request>()
      : GqlExecutionContext.create(context).getContext().req;

    const clientIp = requestIp.getClientIp(request);
    const user = request.user as User;

    const blackListIp = ['49.164.144.7'];
    console.log('요청자 아이피', clientIp);
    if (!user) {
      console.log('인증정보가 없습니다만, 설정된 접속 아이피가 없으므로 통과!');
    }

    const canAllAccess = user.role.includes(UserRoleEnum.ADMIN_ACCESS);
    if (!canAllAccess) {
      throw new UnauthorizedException(
        `올엑세스 권한이 없는 당신의 아이피는 ${clientIp} 입니다..`,
      );
    }

    return next.handle().pipe();
  }
}
