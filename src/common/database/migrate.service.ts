import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { config, database, up } from 'migrate-mongo';

@Injectable()
export class MigrateService implements OnModuleInit {
  protected readonly options = {
    mongodb: {
      url: this.config.get('DB_URL'),
      databaseName: this.config.get('DB_NAME'),
    },
    changelogCollectionName: 'migration',
    migrationsDir: `${__dirname}/../../migrations`,
  };

  constructor(protected readonly config: ConfigService) {}

  async onModuleInit() {
    config.set(this.options);
    const { db, client } = await database.connect();
    await up(db, client);
  }
}
