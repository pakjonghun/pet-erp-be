import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateOrderInput,
  CreateOrderProductInput,
} from './dto/create-order.input';
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

  async findStocksOrder(productName: string) {
    const product = await this.productModel.findOne({ name: productName });
    if (!product) {
      throw new NotFoundException(
        `${productName}은 존재하지 않는 제품 입니다.`,
      );
    }

    const orderList = await this.productOrderRepository.model
      .find({
        products: {
          $elemMatch: {
            product: product._id,
          },
        },
      })
      .sort({ isDone: 1, createdAt: -1 })
      .lean<ProductOrder[]>();

    return orderList;
  }

  async create({ factory, products, ...body }: CreateOrderInput) {
    const factoryDoc = await this.factoryCheck(factory);
    const productList = await this.productsCheck(products);

    const newProducts = productList.map((product) => {
      const targetProduct = products.find(
        (item) => item.product === (product.name as unknown as string),
      );

      return {
        product,
        count: targetProduct.count,
        leftCount: targetProduct.count,
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

  async update({ _id, ...body }: UpdateOrderInput) {
    let factory: undefined | Factory;
    if (body.factory) {
      factory = await this.factoryCheck(body.factory);
    }

    let newProductList = [];
    if (body.products) {
      const productList = await this.productsCheck(body.products);
      newProductList = productList.map((product) => {
        const targetProduct = body.products.find(
          (item) => item.product === (product.name as unknown as string),
        );

        return {
          product,
          count: targetProduct.count,
        };
      });
    }

    const result = await this.productOrderRepository.update(
      { _id },
      {
        ...body,
        products: newProductList,
        factory,
      },
    );
    return result;
  }

  remove(_id: string) {
    return this.productOrderRepository.remove({ _id });
  }

  private async factoryCheck(factoryName: string) {
    const factoryDoc = await this.factoryModel.findOne({ name: factoryName });
    if (!factoryDoc) this.notFoundException({ name: factoryName });
    return factoryDoc;
  }

  private async productsCheck(products: CreateOrderProductInput[]) {
    const productNames = products.map((item) => item.product);
    const productList = await this.productModel.find({
      name: { $in: productNames },
    });

    if (productList.length !== productNames.length) {
      this.notFoundException({ name: { $in: productNames } });
    }

    return productList;
  }

  private notFoundException(query: FilterQuery<any>) {
    throw new NotFoundException(`해당 데이터가 존재하지 않습니다.${query}`);
  }
}
