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
import {
  ProductOrder,
  ProductOrderSchema,
} from 'src/product-order/entities/product-order.entity';
import { Sale, saleSchema } from 'src/sale/entities/sale.entity';
import { Factory, FactorySchema } from 'src/factory/entities/factory.entity';
import { Client, clientSchema } from 'src/client/entities/client.entity';
import { LogModule } from 'src/log/log.module';

@Module({
  exports: [StockService],
  imports: [
    DatabaseModule.forFeature([
      {
        name: ProductOrder.name,
        schema: ProductOrderSchema,
      },
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
      {
        name: Sale.name,
        schema: saleSchema,
      },
      {
        name: Factory.name,
        schema: FactorySchema,
      },
      {
        name: Client.name,
        schema: clientSchema,
      },
    ]),
    LogModule,
  ],
  providers: [StockResolver, StockService, StockRepository],
})
export class StockModule {}
