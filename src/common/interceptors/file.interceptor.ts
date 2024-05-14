import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { map } from 'rxjs';
import { Response } from 'express';
import { UtilService } from '../../util/util.service';

@Injectable()
export class FileInspector implements NestInterceptor {
  constructor(private readonly utilService: UtilService) {}
  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const isHttp = context.getType() == 'http';

    return next.handle().pipe(
      map((data) => {
        if (isHttp && Buffer.isBuffer(data)) {
          const res = context.switchToHttp().getResponse<Response>();
          res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          );

          return new StreamableFile(data);
        }

        return data;
      }),
    );
  }
}
