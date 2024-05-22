import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageResolver } from './storage.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Storage, StorageSchema } from './entities/storage.entity';
import { StorageRepository } from './storage.repository';
import { StorageLoader } from './storage.loader';
import { Stock, StockSchema } from 'src/stock/entities/stock.entity';

@Module({
  imports: [
    DatabaseModule.forFeature([
      {
        name: Storage.name,
        schema: StorageSchema,
      },
      {
        name: Stock.name,
        schema: StockSchema,
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
