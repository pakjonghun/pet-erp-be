import { Module, forwardRef } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryResolver } from './product-category.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import {
  ProductCategory,
  productCategorySchema,
} from './entities/product-category.entity';
import { ProductCategoryRepository } from './product-category.repository';
import { ProductModule } from 'src/product/product.module';
import { AppModule } from 'src/app.module';

@Module({
  exports: [ProductCategoryService],
  imports: [
    forwardRef(() => AppModule),
    forwardRef(() => ProductModule),
    DatabaseModule.forFeature([
      { name: ProductCategory.name, schema: productCategorySchema },
    ]),
  ],
  providers: [
    ProductCategoryResolver,
    ProductCategoryService,
    ProductCategoryRepository,
  ],
})
export class ProductCategoryModule {}
