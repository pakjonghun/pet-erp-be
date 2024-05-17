import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';
import { MigrateService } from './migrate.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get('DB_URL'),
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MigrateService],
})
export class DatabaseModule {
  static forFeature(definitions: ModelDefinition[]) {
    return MongooseModule.forFeature(definitions);
  }
}
