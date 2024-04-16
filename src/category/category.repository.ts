import { Category } from './entities/category.entity';
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CategoryRepository extends AbstractRepository<Category> {
  protected readonly logger = new Logger(CategoryRepository.name);
  constructor(@InjectModel(Category.name) categoryModel: Model<Category>) {
    super(categoryModel);
  }
}
