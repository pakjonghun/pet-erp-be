import { ProductCategory } from './entities/product-category.entity';
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProductCategoryRepository extends AbstractRepository<ProductCategory> {
  protected readonly logger = new Logger(ProductCategoryRepository.name);
  constructor(
    @InjectModel(ProductCategory.name) categoryModel: Model<ProductCategory>,
  ) {
    super(categoryModel);
  }
}
