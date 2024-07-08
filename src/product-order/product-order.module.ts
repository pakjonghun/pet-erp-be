import { Module } from '@nestjs/common';
import { ProductOrderService } from './product-order.service';
import { DatabaseModule } from 'src/common/database/database.module';
import { Product } from 'src/product/entities/product.entity';
import { ProductOrderRepository } from './product-order.repository';
import {
  ProductOrder,
  ProductOrderSchema,
} from './entities/product-order.entity';
import { Factory, FactorySchema } from 'src/factory/entities/factory.entity';
import { ProductOrderResolver } from './product-order.resolver';
import { StockModule } from 'src/stock/stock.module';
import { StorageSchema, Storage } from 'src/storage/entities/storage.entity';

@Module({
  imports: [
    DatabaseModule.forFeature([
      { name: Product.name, schema: ProductOrderSchema },
      { name: ProductOrder.name, schema: ProductOrderSchema },
      { name: Factory.name, schema: FactorySchema },
      { name: Storage.name, schema: StorageSchema },
    ]),
    StockModule,
  ],
  providers: [
    ProductOrderResolver,
    ProductOrderService,
    ProductOrderRepository,
  ],
})
export class ProductOrderModule {}
