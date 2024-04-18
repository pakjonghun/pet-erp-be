import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Product } from './product.entity';
import { FilterQuery, Model } from 'mongoose';

@Injectable()
export class ProductRepository extends AbstractRepository<Product> {
  protected readonly logger = new Logger();

  constructor(@InjectModel(Product.name) productMode: Model<Product>) {
    super(productMode);
  }

  async findFullOneProduct(query: FilterQuery<Product>) {
    const result = await this.model
      .findOne(query)
      .populate({
        path: 'category',
        select: ['_id', 'name'],
      })
      .lean<Product>();
    return result;
  }
}
