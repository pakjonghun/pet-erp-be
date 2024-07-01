import { Module, forwardRef } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductResolver } from './product.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Product, productSchema } from './entities/product.entity';
import { ProductRepository } from './product.repository';
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
import { ProductLoader } from './product.loader';
import { Stock, StockSchema } from 'src/stock/entities/stock.entity';
import { Sale, saleSchema } from 'src/sale/entities/sale.entity';
import { Storage, StorageSchema } from 'src/storage/entities/storage.entity';

@Module({
  exports: [ProductService, ProductLoader],
  imports: [
    DatabaseModule.forFeature([
      { name: Storage.name, schema: StorageSchema },
      { name: Product.name, schema: productSchema },
      { name: Subsidiary.name, schema: SubsidiarySchema },
      { name: ProductOrder.name, schema: ProductOrderSchema },
      { name: Stock.name, schema: StockSchema },
      { name: Sale.name, schema: saleSchema },
    ]),
    SaleModule,
    forwardRef(() => ProductCategoryModule),
  ],
  providers: [
    ProductResolver,
    ProductService,
    ProductRepository,
    ProductSubsidiaryRepository,
    ProductLoader,
  ],
})
export class ProductModule {}
