import { saleSchema } from './../sale/entities/sale.entity';
import { Module } from '@nestjs/common';
import { WholeSaleService } from './whole-sale.service';
import { WholeSaleResolver } from './whole-sale.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Sale } from 'src/sale/entities/sale.entity';
import { WholeSaleRepository } from './whole-sale.repository';
import { Product, productSchema } from 'src/product/entities/product.entity';
import { Storage, StorageSchema } from 'src/storage/entities/storage.entity';
import { Client, clientSchema } from 'src/client/entities/client.entity';
import { Stock, StockSchema } from 'src/stock/entities/stock.entity';
import { StockModule } from 'src/stock/stock.module';
import {
  DeliveryCost,
  DeliveryCostSchema,
} from 'src/sale/entities/delivery.entity';

@Module({
  imports: [
    DatabaseModule.forFeature([
      { name: DeliveryCost.name, schema: DeliveryCostSchema },
      { name: Sale.name, schema: saleSchema },
      { name: Client.name, schema: clientSchema },
      { name: Product.name, schema: productSchema },
      { name: Storage.name, schema: StorageSchema },
      { name: Stock.name, schema: StockSchema },
    ]),
    StockModule,
  ],
  providers: [WholeSaleResolver, WholeSaleService, WholeSaleRepository],
})
export class WholeSaleModule {}
