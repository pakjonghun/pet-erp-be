import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';
import { ProductOrderRepository } from './product-order.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Factory } from 'src/factory/entities/factory.entity';
import { FilterQuery, Model } from 'mongoose';
import { Product } from 'src/product/entities/product.entity';
import { OrdersInput } from './dto/orders.input';
import { ProductOrder } from './entities/product-order.entity';

@Injectable()
export class ProductOrderService {
  constructor(
    private readonly productOrderRepository: ProductOrderRepository,
    @InjectModel(Factory.name) private readonly factoryModel: Model<Factory>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async create({ factory, products, ...body }: CreateOrderInput) {
    const factoryDoc = await this.factoryModel.findById(factory);
    if (!factoryDoc) this.notFoundException({ _id: factory });

    const productIds = products.map((item) => item.product);
    const productList = await this.productModel.find({
      _id: { $in: productIds },
    });

    if (productList.length !== productIds.length) {
      this.notFoundException({ _id: { $in: productIds } });
    }

    const newProducts = productList.map((product) => {
      const targetProduct = products.find(
        (item) => item.product === (product._id as unknown as String),
      );

      return {
        product,
        count: targetProduct.count,
      };
    });

    return this.productOrderRepository.create({
      ...body,
      factory: factoryDoc,
      products: newProducts,
    });
  }

  async findMany({ keyword, ...query }: OrdersInput) {
    const newQuery = {
      filterQuery: {
        $or: [
          { factory: { $exists: keyword, $options: 'i' } },
          {
            products: {
              $elemMatch: {
                name: { $exists: keyword, $options: 'i' },
              },
            },
          },
        ],
      },
      ...query,
    };
    return this.productOrderRepository.findMany(newQuery);
  }

  update({ _id, ...updateOrderInput }: UpdateOrderInput) {
    return this.productOrderRepository.update({ _id }, updateOrderInput);
  }

  remove(_id: string) {
    return this.productOrderRepository.remove({ _id });
  }

  private notFoundException(query: FilterQuery<any>) {
    throw new NotFoundException(`해당 데이터가 존재하지 않습니다.${query}`);
  }
}
