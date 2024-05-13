import { Module } from '@nestjs/common';
import { ProductOrderService } from './product-order.service';
import { ProductOrderResolver } from './product-order.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Product } from 'src/product/entities/product.entity';
import { ProductOrderRepository } from './product-order.repository';
import {
  ProductOrder,
  ProductOrderSchema,
} from './entities/product-order.entity';
import { Factory, FactorySchema } from 'src/factory/entities/factory.entity';

@Module({
  imports: [
    DatabaseModule.forFeature([
      { name: Product.name, schema: ProductOrderSchema },
      { name: ProductOrder.name, schema: ProductOrderSchema },
      { name: Factory.name, schema: FactorySchema },
    ]),
  ],
  providers: [
    ProductOrderResolver,
    ProductOrderService,
    ProductOrderRepository,
  ],
})
export class ProductOrderModule {}
