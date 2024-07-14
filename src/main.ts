import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filter/http-exception';
import { FileService } from './common/services/file.service';
import { ErrorExceptionFilter } from './common/filter/error-exception';
import { AllErrorExceptionFilter } from './common/filter/all-exception';
import * as cookieParser from 'cookie-parser';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origin = config.get('WHITE_ORIGIN');
  app.useLogger(app.get(Logger));
  app.enableCors({
    credentials: true,
    origin,
  });
  app.use(cookieParser());

  app.setGlobalPrefix('/api');
  const fileService = app.get(FileService);
  app.useGlobalFilters(
    new AllErrorExceptionFilter(fileService),
    new ErrorExceptionFilter(fileService),
    new HttpExceptionFilter(fileService),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      exceptionFactory: (errors) => {
        const messages = formatErrors(errors);
        return new BadRequestException(messages.join(', '));
      },
    }),
  );
  const port = config.get('PORT');
  await app.listen(port ? Number(port) : 8000);
}
bootstrap();

function formatErrors(errors: ValidationError[]): string[] {
  const result = [];

  function recursiveErrorParser(error: ValidationError, path: string[] = []) {
    const currentPath = [...path, error.property];
    if (error.constraints) {
      for (const key in error.constraints) {
        result.push(error.constraints[key]);
      }
    }

    if (error.children && error.children.length > 0) {
      for (const childError of error.children) {
        recursiveErrorParser(childError, currentPath);
      }
    }
  }

  for (const error of errors) {
    recursiveErrorParser(error);
  }

  return result;
}
