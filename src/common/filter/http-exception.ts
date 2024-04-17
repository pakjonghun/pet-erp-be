import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileService } from '../services/file.service';
import { cwd } from 'process';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly fileService: FileService) {}
  async catch(exception: HttpException, host: ArgumentsHost) {
    const isHttp = host.getType() === 'http';
    if (isHttp) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const status = exception.getStatus();
      await this.fileService.emptyFolder(`/${cwd()}/upload`);
      response.status(status).json({
        message: exception.message,
      });
    } else {
      return exception;
    }
  }
}
