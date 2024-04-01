import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { ValidationException } from '../exceptions/validation.exception';
import { Response } from 'express';

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger();

  catch(exception: ValidationException, host: ArgumentsHost) {
    const type = host.getType();
    const message = exception.validationError[0];
    if (type === 'http') {
      const ctx = host.switchToHttp();
      const res = ctx.getResponse<Response>();
      const status = exception.getStatus();
      this.logger.error(message);
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
