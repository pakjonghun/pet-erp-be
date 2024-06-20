import { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable, Logger } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { FactoryLoader } from 'src/factory/factory.loader';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ProductLoader } from 'src/product/product.loader';
import { StorageLoader } from 'src/storage/storage.loader';
@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  constructor(
    private readonly factoryLoader: FactoryLoader,
    private readonly productLoader: ProductLoader,
    private readonly storageLoader: StorageLoader,
  ) {}
  createGqlOptions(): ApolloDriverConfig {
    return {
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      playground: false,
      autoSchemaFile: true,
      path: '/api/graphql',
      context: ({ req, res }) => {
        const factoryLoader = this.factoryLoader.createLoader();
        const productLoader = this.productLoader.createLoader();
        const storageLoader = this.storageLoader.createLoader();
        return {
          req,
          res,
          loaders: {
            factoryLoader,
            productLoader,
            storageLoader,
          },
        };
      },
      formatError: (error) => {
        console.log('!!!!!!', error);
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
    };
  }
}
