import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductResolver } from './product.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Product, productSchema } from './entities/product.entity';
import { ProductRepository } from './entities/product.repository';

@Module({
  exports: [ProductService],
  imports: [
    DatabaseModule.forFeature([{ name: Product.name, schema: productSchema }]),
  ],
  providers: [ProductResolver, ProductService, ProductRepository],
})
export class ProductModule {}
