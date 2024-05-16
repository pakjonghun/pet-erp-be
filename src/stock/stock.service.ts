import { Product } from './../product/entities/product.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStockInput } from './dto/create-stock.input';
import { InjectModel } from '@nestjs/mongoose';
import {
  AnyBulkWriteOperation,
  FilterQuery,
  Model,
  PipelineStage,
} from 'mongoose';
import { Subsidiary } from 'src/subsidiary/entities/subsidiary.entity';
import { Storage } from 'src/storage/entities/storage.entity';
import { Stock } from './entities/stock.entity';
import { StockRepository } from './stock.repository';
import { StocksInput } from './dto/stocks.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { ProductOrder } from 'src/product-order/entities/product-order.entity';
import { UtilService } from 'src/util/util.service';
import { Sale } from 'src/sale/entities/sale.entity';
import { StockColumn } from './dto/stocks.output';
import { StockStateOutput } from './dto/stocks-state.output';
import { ObjectId } from 'mongodb';
import * as dayjs from 'dayjs';
import { Factory } from 'src/factory/entities/factory.entity';

@Injectable()
export class StockService {
  constructor(
    private readonly utilService: UtilService,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
    @InjectModel(ProductOrder.name)
    private readonly productOrderModel: Model<Storage>,
    @InjectModel(Subsidiary.name)
    private readonly subsidiaryModel: Model<Subsidiary>,
    private readonly stockRepository: StockRepository,
    @InjectModel(Factory.name)
    private readonly factoryModel: Model<Factory>,
  ) {}

  async findStockByState(productName: string) {
    try {
      const product = await this.productModel.findOne({ name: productName });
      console.log('product : ', product);
      if (!product) {
        throw new NotFoundException(
          `${productName}은 존재하지 않는 제품입니다.`,
        );
      }

      const factoryList = await this.factoryModel.find({}).lean<Factory[]>();
      const storageList = await this.storageModel.find({}).lean<Storage[]>();

      const orderList = await this.productOrderModel
        .find({
          products: {
            $elemMatch: {
              product: product._id,
            },
          },
          isDone: false,
        })
        .lean<ProductOrder[]>();

      const factoryMap = new Map<string, StockStateOutput[]>();
      orderList.forEach((order) => {
        const factoryId = (order.factory as unknown as ObjectId).toHexString();
        if (factoryMap.has(factoryId)) return;

        factoryMap.set(factoryId, []);
      });

      orderList.forEach((order) => {
        const createdAt = order.createdAt;

        const factoryId = (order.factory as unknown as ObjectId).toHexString();
        const orderCompleteDate =
          product.leadTime == null
            ? null
            : dayjs(createdAt)
                .add(product.leadTime ?? 0, 'day')
                .format('YYYY-MM-DD');
        order.products.forEach((item) => {
          const productId = (item.product as unknown as ObjectId).toHexString();
          if (productId !== productId) return;

          const locationDoc = factoryList.find(
            (factory) =>
              factory._id.toHexString() ==
              (order.factory as unknown as ObjectId).toHexString(),
          );
          if (!locationDoc) return;

          const factoryItem = factoryMap.get(factoryId);
          if (!factoryItem) return;

          const existItemIndex = factoryItem.findIndex(
            (item) => item.orderCompleteDate === orderCompleteDate,
          );
          const prevCount = factoryItem[existItemIndex]?.count ?? 0;
          const newItem: StockStateOutput = {
            productName: product.name,
            count: prevCount + item.count,
            location: locationDoc.name,
            orderCompleteDate,
            state: '제조중',
          };
          if (existItemIndex != -1) {
            factoryItem[existItemIndex] = newItem;
          } else {
            factoryItem.push(newItem);
          }
        });
      });

      const stockList = await this.stockRepository.model
        .find({
          product: product._id,
        })
        .lean<Stock[]>();

      const stockValues = stockList.map((stock) => {
        const location = storageList.find(
          (item) =>
            item._id.toHexString() ==
            (stock.storage as unknown as ObjectId).toHexString(),
        );
        if (!location) return;

        const newItem: StockStateOutput = {
          productName: product.name,
          count: stock.count,
          location: location.name,
          orderCompleteDate: null,
          state: '보관중',
        };

        return newItem;
      });

      const orderValues = Array.from(factoryMap.values()).flat();

      return orderValues.concat(stockValues);
    } catch (e) {
      console.log(e);
    }
  }

  async add({ stocks }: CreateStockInput) {
    for await (const {
      productName,
      storageName,
      count,
      isSubsidiary,
    } of stocks) {
      const product = await this.productModel.findOne({ name: productName });
      if (!product) {
        throw new NotFoundException(
          `${productName}는 존재하지 않는 제품 입니다.`,
        );
      }

      const storage = await this.storageModel.findOne({ name: storageName });
      if (!storage) {
        throw new NotFoundException(
          `${storageName}는 존재하지 않는 창고 아이디 입니다.`,
        );
      }

      const stock = await this.findOne({
        storage,
        product,
      });

      if (!stock) {
        await this.stockRepository.create({
          count,
          isSubsidiary,
          product,
          storage,
        });
      } else {
        await this.stockRepository.update(
          { _id: stock._id },
          {
            count: stock.count + count,
          },
        );
      }
    }
  }

  async out({ stocks }: CreateStockInput) {
    const newStock: AnyBulkWriteOperation<Stock>[] = [];

    for await (const { productName, storageName, count } of stocks) {
      const product = await this.productModel.findOne({ name: productName });
      if (!product) {
        throw new NotFoundException(
          `${productName}는 존재하지 않는 제품 입니다.`,
        );
      }

      const storage = await this.storageModel.findOne({ name: storageName });
      if (!storage) {
        throw new NotFoundException(
          `${storageName}는 존재하지 않는 창고 입니다.`,
        );
      }

      const stock = await this.findOne({
        storage,
        product,
      });

      if (!stock) {
        throw new ConflictException(
          `${storage.name}창고에 ${product.name} 제품이 존재하지 않습니다.`,
        );
      }

      if (stock.count < count) {
        throw new ConflictException(
          `재고가 부족합니다. ${storage.name}에 ${product.name} 제품은 ${stock.count}EA 남아있습니다.`,
        );
      }

      newStock.push({
        updateOne: {
          filter: { _id: stock._id },
          update: { $set: { count: stock.count - count } },
        },
      });
    }

    await this.stockRepository.model.bulkWrite(newStock);
  }

  findAll() {
    return `This action returns all stock`;
  }

  async findMany({
    keyword,
    limit,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    skip,
    storageName,
  }: StocksInput) {
    type CountAggregate = { _id: string; accCount: number };

    const filterQuery: Record<string, any> = {
      name: { $regex: keyword, $options: 'i' },
    };

    let stocks: Stock[] = [];

    if (storageName) {
      const storage = await this.storageModel.findOne({ name: storageName });
      if (!storage) {
        throw new NotFoundException(
          `${storageName}은 존재하지 않는 창고 입니다.`,
        );
      }

      stocks = await this.stockRepository.model
        .find({
          storage: storage._id,
        })
        .lean<Stock[]>();

      const initProductIds = stocks.map((stock) => stock.product);
      filterQuery._id = { $in: initProductIds };
    }

    const productList = await this.productModel
      .find(filterQuery)
      .select(['_id', 'code', 'name', 'leadTime', 'wonPrice'])
      .limit(limit)
      .skip(skip)
      .sort({ [sort]: order == OrderEnum.DESC ? -1 : 1 })
      .lean<Product[]>();

    const productIdList = productList.map((item) => item._id);
    const productCodeList = productList.map((item) => item.code);

    let stockPipeLine: PipelineStage[] = [];
    if (storageName && stocks.length) {
      stockPipeLine = [
        {
          $match: {
            _id: { $in: stocks.map((stock) => stock._id) },
            count: {
              $exists: true,
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            accCount: { $sum: '$count' },
          },
        },
        {
          $project: {
            _id: { $toString: '$_id' },
            accCount: 1,
          },
        },
      ];
    } else {
      stockPipeLine = [
        {
          $match: {
            product: { $in: productIdList },
            count: {
              $exists: true,
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            accCount: { $sum: '$count' },
          },
        },
        {
          $project: {
            _id: { $toString: '$_id' },
            accCount: 1,
          },
        },
      ];
    }

    const stockList =
      await this.stockRepository.model.aggregate<CountAggregate>(stockPipeLine);
    const stockMap = new Map(
      stockList.map((stock) => [stock._id, stock.accCount]),
    );

    const orderPipeLine: PipelineStage[] = [
      {
        $match: {
          products: {
            $elemMatch: {
              product: { $in: productIdList },
            },
          },
          isDone: false,
        },
      },
      {
        $project: {
          products: 1,
        },
      },
      {
        $unwind: '$products',
      },
      {
        $match: {
          'products.product': { $in: productIdList },
        },
      },
      {
        $project: {
          'products._id': 0,
        },
      },
      {
        $group: {
          _id: '$products.product',
          accCount: { $sum: '$products.count' },
        },
      },
      {
        $project: {
          _id: { $toString: '$_id' },
          accCount: 1,
        },
      },
    ];
    const orderList =
      await this.productOrderModel.aggregate<CountAggregate>(orderPipeLine);
    const orderMap = new Map(
      orderList.map((order) => [order._id, order.accCount]),
    );

    const [from, to] = this.utilService.recentDayjsMonthRange();
    const salePipeLine: PipelineStage[] = [
      {
        $match: {
          productCode: { $in: productCodeList },
          count: { $exists: true },
          saleAt: {
            $exists: true,
            $gte: from.toDate(),
            $lte: to.toDate(),
          },
        },
      },
      {
        $group: {
          _id: '$productCode',
          accCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $ne: ['$count', null] }, { $isNumber: '$count' }],
                },
                '$count',
                0,
              ],
            },
          },
        },
      },
    ];
    const saleList =
      await this.saleModel.aggregate<CountAggregate>(salePipeLine);
    const saleMap = new Map(
      saleList.map((stock) => [stock._id, stock.accCount]),
    );

    const data = productList.map((item) => {
      const projectId = item._id.toHexString();
      const saleItem = saleMap.get(item.code) ?? 0;
      const orderItem = orderMap.get(projectId) ?? 0;
      const stockItem = stockMap.get(projectId) ?? 0;

      const daySale = saleItem / 30;
      const leftDate = daySale == 0 ? null : Math.floor(stockItem / daySale);

      const newData: StockColumn = {
        wonPrice: item.wonPrice,
        leftDate: stockItem == 0 ? -1 : leftDate,
        monthSaleCount: saleItem,
        productName: item.name,
        stockCount: `${this.utilService.getNumberWithComma(stockItem)}(+${this.utilService.getNumberWithComma(orderItem)})`,
        leadTime: item.leadTime,
      };

      return newData;
    });
    // console.log('data : ', data);
    // console.log('result  : ', result);

    const totalCount = await this.productModel.countDocuments(filterQuery);

    return { totalCount, data };
  }
  private findOne(filterQuery: FilterQuery<Stock>) {
    return this.stockRepository.findOne(filterQuery);
  }
}
