import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filter/http-exception';
import { FileService } from './common/services/file.service';
import { ErrorExceptionFilter } from './common/filter/error-exception';
import { AllErrorExceptionFilter } from './common/filter/all-exception';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origin = config.get('WHITE_ORIGIN');
  app.useLogger(app.get(Logger));
  app.enableCors({
    credentials: true,
    origin,
    methods: ['POST', 'PUT', 'GET', 'DELETE', 'PATCH'],
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
        const messages = errors.map((error) => {
          const attr = error.property;
          const value = error.value;
          const constraints = error.constraints;
          if (Object.keys(constraints).length === 0) {
            return `${attr}의 값 ${value}는 잘못된 값입니다.`;
          } else {
            return Object.values(constraints)[0];
          }
        });
        return new BadRequestException(
          messages?.[0] ?? BadRequestException.name,
        );
      },
    }),
  );
  const port = config.get('PORT');
  await app.listen(port ? Number(port) : 8000);
}
bootstrap();
