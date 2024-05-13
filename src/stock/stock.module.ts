import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockResolver } from './stock.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Storage, StorageSchema } from 'src/storage/entities/storage.entity';
import { Product, productSchema } from 'src/product/entities/product.entity';
import {
  Subsidiary,
  SubsidiarySchema,
} from 'src/subsidiary/entities/subsidiary.entity';
import { StockRepository } from './stock.repository';
import { Stock, StockSchema } from './entities/stock.entity';

@Module({
  imports: [
    DatabaseModule.forFeature([
      {
        name: Product.name,
        schema: productSchema,
      },
      {
        name: Storage.name,
        schema: StorageSchema,
      },
      {
        name: Subsidiary.name,
        schema: SubsidiarySchema,
      },
      {
        name: Stock.name,
        schema: StockSchema,
      },
    ]),
  ],
  providers: [StockResolver, StockService, StockRepository],
})
export class StockModule {}
