import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpFilter implements ExceptionFilter {
  private readonly logger = new Logger();

  catch(exception: HttpException, host: ArgumentsHost) {
    const type = host.getType();
    const message = exception.message;
    if (type == 'http') {
      const ctx = host.switchToHttp();
      const res = ctx.getResponse<Response>();
      const status = exception.getStatus();
      this.logger.error(exception.message);

      return res.status(status).json({
        message,
      });
    } else {
      this.logger.error(message);
      exception.message = message;
      return exception;
    }
  }
}
