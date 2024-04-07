import { LogInterceptor } from './common/interceptors/log.interceptor';
import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { DatabaseModule } from './common/database/database.module';
import { LoggerModule } from 'nestjs-pino';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GqlAuthGuard } from './auth/guards/gql.guard';
import { LogModule } from './log/log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required(),
        WHITE_ORIGIN: Joi.string().required(),
      }),
    }),
    LoggerModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: !isProduction ? 'debug' : 'info',
            transport: !isProduction
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                  },
                }
              : undefined,
          },
        };
      },
      //
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
      formatError: (error) => {
        const originalError = error.extensions?.originalError as object;
        const statusCode =
          'statusCode' in originalError && originalError.statusCode;

        new Logger().error(error);
        return {
          message: error.message,
          code: error.extensions.code,
          locations: error.locations,
          path: error.path,
          statusCode,
        };
      },
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    LogModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
    AppService,
  ],
})
export class AppModule {}
