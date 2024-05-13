import { LogInterceptor } from './common/interceptors/log.interceptor';
import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { LoggerModule } from 'nestjs-pino';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GqlAuthGuard } from './auth/guards/gql.guard';
import { LogModule } from './log/log.module';
import { DateScalar } from './common/scalars/datetime.scalar';
import { ProductModule } from './product/product.module';
import { ClientModule } from './client/client.module';
import { FileService } from './common/services/file.service';
import { SaleModule } from './sale/sale.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductCategoryModule } from './product-category/product-category.module';
import { FileInspector } from './common/interceptors/file.interceptor';
import { SubsidiaryModule } from './subsidiary/subsidiary.module';
import { SubsidiaryCategoryModule } from './subsidiary-category/subsidiary-category.module';
import * as Joi from 'joi';
import { UtilService } from './common/services/util.service';
import { WholeSaleModule } from './whole-sale/whole-sale.module';
import { StockModule } from './stock/stock.module';
import { FactoryModule } from './factory/factory.module';
import { StorageModule } from './storage/storage.module';
import { ProductOrderModule } from './product-order/product-order.module';

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
        DELIVERY_URL: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        AWS_ACCESS_ID: Joi.string().required(),
        AWS_SECRET: Joi.string().required(),
        AWS_BUCKET: Joi.string().required(),
        COMPANY_ID: Joi.string().required(),
        SEND_AUTH_KEY: Joi.string().required(),
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
      path: '/api/graphql',
      context: ({ req, res }) => {
        return { req, res };
      },
      formatError: (error) => {
        const originalError = error.extensions?.originalError as object;
        const statusCode =
          typeof originalError == 'object' &&
          'statusCode' in originalError &&
          originalError.statusCode;
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
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    LogModule,
    ProductModule,
    ClientModule,
    SaleModule,
    ProductCategoryModule,
    SubsidiaryModule,
    SubsidiaryCategoryModule,
    WholeSaleModule,
    StockModule,
    FactoryModule,
    StorageModule,
    ProductOrderModule,
  ],
  exports: [FileService, UtilService],
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
    {
      provide: APP_INTERCEPTOR,
      useClass: FileInspector,
    },
    DateScalar,
    AppService,
    FileService,
    UtilService,
  ],
})
export class AppModule {}
