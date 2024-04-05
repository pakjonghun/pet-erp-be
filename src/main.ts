import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
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
  const port = app.get(ConfigService).get('PORT');
  await app.listen(port ? Number(port) : 8000);
}
bootstrap();
