import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageResolver } from './storage.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Storage, StorageSchema } from './entities/storage.entity';
import { StorageRepository } from './storage.repository';
import { StorageLoader } from './storage.loader';

@Module({
  imports: [
    DatabaseModule.forFeature([
      {
        name: Storage.name,
        schema: StorageSchema,
      },
    ]),
  ],
  providers: [
    StorageResolver,
    StorageService,
    StorageRepository,
    StorageLoader,
  ],
  exports: [StorageService, StorageLoader],
})
export class StorageModule {}
