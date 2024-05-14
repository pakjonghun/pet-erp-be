import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { ProductOrder } from './entities/product-order.entity';
import { Model } from 'mongoose';

@Injectable()
export class ProductOrderRepository extends AbstractRepository<ProductOrder> {
  logger = new Logger(ProductOrderRepository.name);

  constructor(
    @InjectModel(ProductOrder.name)
    public readonly saleModel: Model<ProductOrder>,
  ) {
    super(saleModel);
  }
}
