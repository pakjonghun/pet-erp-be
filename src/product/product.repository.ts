import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Product } from './entities/product.entity';
import { FilterQuery, Model } from 'mongoose';
import { ProductsInput } from './dtos/products-input';
import { UtilService } from 'src/util/util.service';

@Injectable()
export class ProductRepository extends AbstractRepository<Product> {
  protected readonly logger = new Logger();

  constructor(
    private readonly utilService: UtilService,
    @InjectModel(Product.name) productMode: Model<Product>,
  ) {
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

  async findFullManyProducts({ keyword, limit, skip }: ProductsInput) {
    const escapedKeyword = this.utilService.escapeRegex(keyword);
    const filterQuery: FilterQuery<Product> = {
      name: { $regex: escapedKeyword, $options: 'i' },
    };
    const totalCount = await this.model.countDocuments(filterQuery);
    const data = await this.model
      .find(filterQuery)
      .populate({
        path: 'category',
        select: ['_id', 'name'],
      })
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean<Product[]>();

    return { totalCount, data };
  }
}
