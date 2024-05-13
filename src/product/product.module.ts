import { Module, forwardRef } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductResolver } from './product.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Product, productSchema } from './entities/product.entity';
import { ProductRepository } from './product.repository';
import { AppModule } from 'src/app.module';
import { SaleModule } from 'src/sale/sale.module';
import { ProductCategoryModule } from 'src/product-category/product-category.module';
import {
  Subsidiary,
  SubsidiarySchema,
} from 'src/subsidiary/entities/subsidiary.entity';
import { ProductSubsidiaryRepository } from './subsidiary.repository';
import {
  ProductOrder,
  ProductOrderSchema,
} from 'src/product-order/entities/product-order.entity';

@Module({
  exports: [ProductService],
  imports: [
    DatabaseModule.forFeature([
      { name: Product.name, schema: productSchema },
      { name: Subsidiary.name, schema: SubsidiarySchema },
      { name: ProductOrder.name, schema: ProductOrderSchema },
    ]),
    SaleModule,
    forwardRef(() => AppModule),
    forwardRef(() => ProductCategoryModule),
  ],
  providers: [
    ProductResolver,
    ProductService,
    ProductRepository,
    ProductSubsidiaryRepository,
  ],
})
export class ProductModule {}
