import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FileService } from '../services/file.service';
import { cwd } from 'process';

@Catch()
export class AllErrorExceptionFilter implements ExceptionFilter {
  constructor(private readonly fileService: FileService) {}
  async catch(exception: Error, host: ArgumentsHost) {
    const isHttp = host.getType() == 'http';
    if (isHttp) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const status = HttpStatus.CONFLICT;
      await this.fileService.emptyFolder(`/${cwd()}/upload`);
      response.status(status).json({
        message: exception.message,
      });
    }

    return exception;
  }
}
