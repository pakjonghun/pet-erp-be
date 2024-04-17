import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Error } from 'mongoose';
import { FileService } from '../services/file.service';
import { cwd } from 'process';

@Catch(Error)
export class ErrorExceptionFilter implements ExceptionFilter {
  constructor(private readonly fileService: FileService) {}

  async catch(exception: Error, host: ArgumentsHost) {
    const isHttp = host.getType() === 'http';

    if (isHttp) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      await this.fileService.emptyFolder(`/${cwd()}/upload`);
      response.status(statusCode).json({
        message: exception.message,
      });
    }

    return exception;
  }
}
