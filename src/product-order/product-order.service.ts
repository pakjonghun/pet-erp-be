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
import { OrderEnum } from 'src/common/dtos/find-many.input';

@Injectable()
export class ProductOrderService {
  constructor(
    private readonly productOrderRepository: ProductOrderRepository,
    @InjectModel(Factory.name) private readonly factoryModel: Model<Factory>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async create({ factory, products, ...body }: CreateOrderInput) {
    const factoryDoc = await this.factoryModel.findOne({ name: factory });
    if (!factoryDoc) this.notFoundException({ name: factory });

    const productNames = products.map((item) => item.product);
    const productList = await this.productModel.find({
      name: { $in: productNames },
    });

    if (productList.length !== productNames.length) {
      this.notFoundException({ name: { $in: productNames } });
    }

    const newProducts = productList.map((product) => {
      const targetProduct = products.find(
        (item) => item.product === (product.name as unknown as string),
      );

      return {
        product,
        count: targetProduct.count,
      };
    });
    const result = await this.productOrderRepository.create({
      ...body,
      factory: factoryDoc,
      products: newProducts,
    });
    return result;
  }

  async findMany({
    keyword,
    skip,
    limit,
    sort = 'createdAt',
    order = OrderEnum.DESC,
  }: OrdersInput) {
    const filterQuery = { name: { $regex: keyword, $options: 'i' } };

    const productList = await this.productModel
      .find(filterQuery)
      .select('_id')
      .lean();

    const factoryList = await this.factoryModel
      .find(filterQuery)
      .select('_id')
      .lean();

    const orderFilterQuery = {
      $or: [
        { factory: { $in: factoryList } },
        { 'products.product': { $in: productList } },
      ],
    };

    const totalCount =
      await this.productOrderRepository.model.countDocuments(orderFilterQuery);

    const data = await this.productOrderRepository.model
      .find(orderFilterQuery)
      .sort({ [sort]: order === OrderEnum.DESC ? -1 : 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean<ProductOrder[]>();
    return {
      data,
      totalCount,
    };
  }

  update({ _id, ...updateOrderInput }: UpdateOrderInput) {
    return this.productOrderRepository.update({ _id }, updateOrderInput);
  }
  //
  remove(_id: string) {
    return this.productOrderRepository.remove({ _id });
  }

  private notFoundException(query: FilterQuery<any>) {
    throw new NotFoundException(`해당 데이터가 존재하지 않습니다.${query}`);
  }
}
