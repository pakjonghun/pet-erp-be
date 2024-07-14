import { ObjectId } from 'mongodb';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateOrderInput,
  CreateOrderProductInput,
} from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';
import { ProductOrderRepository } from './product-order.repository';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Factory } from 'src/factory/entities/factory.entity';
import { Connection, FilterQuery, Model } from 'mongoose';
import { Product } from 'src/product/entities/product.entity';
import { OrdersInput } from './dto/orders.input';
import { ProductOrder } from './entities/product-order.entity';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { UtilService } from 'src/util/util.service';
import { CompleteOrderInput } from './dto/complete-order.input';
import { StockService } from 'src/stock/stock.service';
import { CreateSingleStockInput } from 'src/stock/dto/create-stock.input';
import { Storage } from 'src/storage/entities/storage.entity';

@Injectable()
export class ProductOrderService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly productOrderRepository: ProductOrderRepository,
    private readonly utilService: UtilService,
    private readonly stockService: StockService,
    @InjectModel(Factory.name) private readonly factoryModel: Model<Factory>,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
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
        isDone: false,
      })
      .sort({ isDone: 1, createdAt: -1 })
      .lean<ProductOrder[]>();

    return orderList.map((item) => {
      return {
        ...item,
        products: item.products.filter(
          (p) => product._id.toHexString() == p.product._id.toHexString(),
        ),
      };
    });
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
    const filterQuery = {
      name: { $regex: this.utilService.escapeRegex(keyword), $options: 'i' },
    };

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
      .sort({ isDone: 1, [sort]: order === OrderEnum.DESC ? -1 : 1, _id: 1 })
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

  async completeOrder(
    { _id, storageName }: CompleteOrderInput,
    userId: string,
  ) {
    const productOrder = await this.productOrderRepository.findOne({ _id });
    if (!productOrder) {
      throw new BadRequestException('해당 발주가 존재하지 않습니다.');
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await this.productOrderRepository.update(
        { _id },
        {
          $set: {
            isDone: true,
          },
        },
        session,
      );

      const productIdList = productOrder.products.map((item) => item.product);
      const productList = await this.productModel.find({
        _id: { $in: productIdList },
      });
      const productById = new Map<string, Product>(
        productList.map((item) => [item._id.toHexString(), item]),
      );

      const stocks: CreateSingleStockInput[] = productOrder.products.map(
        (item) => {
          return {
            count: item.count,
            productName:
              productById.get(
                (item.product as unknown as ObjectId).toHexString(),
              ).name ?? '',
            isSubsidiary: false,
            storageName,
          };
        },
      );

      await this.stockService.add({ stocks }, userId, session);

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `서버에서 오류가 발생했습니다. ${error.message}`,
      );
    } finally {
      await session.endSession();
    }
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
