import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { ProductOrder } from './entities/product-order.entity';
import { Model } from 'mongoose';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { FindManyInput } from 'src/common/database/types';

@Injectable()
export class ProductOrderRepository extends AbstractRepository<ProductOrder> {
  logger = new Logger(ProductOrderRepository.name);

  constructor(
    @InjectModel(ProductOrder.name)
    public readonly saleModel: Model<ProductOrder>,
  ) {
    super(saleModel);
  }

  async findMany({
    skip,
    limit,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    filterQuery,
  }: FindManyInput<ProductOrder>) {
    const orderNumber = order === OrderEnum.DESC ? -1 : 1;
    const totalCount = await this.model.countDocuments(filterQuery);
    const data = await this.model
      .find()
      .populate({
        path: 'factory',
        match: filterQuery,
      })
      .sort({ [sort]: orderNumber, _id: 1, isDone: 1 })
      .skip(skip)
      .limit(limit)
      .lean<ProductOrder[]>();

    return { totalCount, data };
  }
}
