import { Module } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { FactoryResolver } from './factory.resolver';
import { FactoryRepository } from './factory.repository';
import { DatabaseModule } from 'src/common/database/database.module';
import { Factory, FactorySchema } from './entities/factory.entity';
import {
  ProductOrder,
  ProductOrderSchema,
} from 'src/product-order/entities/product-order.entity';
import { FactoryLoader } from './factory.loader';
import { Product, productSchema } from 'src/product/entities/product.entity';

@Module({
  imports: [
    DatabaseModule.forFeature([
      {
        name: Factory.name,
        schema: FactorySchema,
      },
      {
        name: ProductOrder.name,
        schema: ProductOrderSchema,
      },

      {
        name: Product.name,
        schema: productSchema,
      },
    ]),
  ],
  providers: [
    FactoryResolver,
    FactoryService,
    FactoryRepository,
    FactoryLoader,
  ],
  exports: [FactoryService, FactoryLoader],
})
export class FactoryModule {}
