import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { Observable, map } from 'rxjs';
import { LOG_META_KEY } from 'src/auth/constants';
import { LogService } from 'src/log/log.service';
import { User } from 'src/users/entities/user.entity';
import { LogMetaData } from '../decorators/log.decorator';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logService: LogService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const isHttp = context.getType() === 'http';
    const request = isHttp
      ? context.switchToHttp().getRequest<Request>()
      : GqlExecutionContext.create(context).getContext().req;

    return next.handle().pipe(
      map(async (data) => {
        const user = request.user as User;
        const logData = this.reflector.get<LogMetaData>(
          LOG_META_KEY,
          context.getHandler(),
        );
        console.log(data);

        if (logData && user) {
          const description = data //
            ? `${logData.description} ${JSON.stringify(data)}`
            : logData.description;

          await this.logService.create({
            logType: logData.logType,
            description,
            userId: user.id,
          });
        }

        return data;
      }),
    );
  }
}
