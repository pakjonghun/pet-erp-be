import { Product } from './../product/entities/product.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateStockInput } from './dto/create-stock.input';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  AnyBulkWriteOperation,
  ClientSession,
  Connection,
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
import { ProductCountStocksInput } from './dto/product-count-stock.input';
import { ProductCountColumn } from './dto/product-count-stock.output';
import { SubsidiaryStockColumn } from './dto/stocks-subsidiary.output';
import { SubsidiaryStockStateOutput } from './dto/stocks-subsidiary-state.output';
import { SubsidiaryCountColumn } from './dto/subsidiary-count-stock.output';
import { Client } from 'src/client/entities/client.entity';
import { LogService } from 'src/log/log.service';
import { LogInterface, LogTypeEnum } from 'src/log/entities/log.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly utilService: UtilService,
    private readonly logService: LogService,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>,
    @InjectModel(ProductOrder.name)
    private readonly productOrderModel: Model<Storage>,
    @InjectModel(Subsidiary.name)
    private readonly subsidiaryModel: Model<Subsidiary>,
    private readonly stockRepository: StockRepository,
    @InjectModel(Factory.name)
    private readonly factoryModel: Model<Factory>,
  ) {}

  async subsidiaryCountStocks({
    keyword: productName,
    limit,
    skip,
    storageName,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    isSubsidiary = true,
  }: ProductCountStocksInput) {
    //이 창고에 있는 모든 상품을 갯수와 함께 반환
    const storage = await this.checkStorageByName(storageName);
    const productList = await this.subsidiaryModel
      .find({
        $or: [
          {
            name: {
              $regex: this.utilService.escapeRegex(productName),
              $options: 'i',
            },
          },
          {
            code: {
              $regex: this.utilService.escapeRegex(productName),
              $options: 'i',
            },
          },
        ],
      })
      .lean<Product[]>();

    const productMap = new Map<string, Product>(
      productList.map((product) => [product._id.toHexString(), product]),
    );

    const productIdList = productList.map((product) => product._id);
    const stockPipeLine: PipelineStage[] = [
      {
        $match: {
          product: { $in: productIdList },
          storage: storage._id,
          count: { $gt: 0 },
          isSubsidiary,
        },
      },
      {
        $facet: {
          result: [
            {
              $sort: {
                [sort]: order === OrderEnum.DESC ? -1 : 1,
                _id: 1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const stockList = await this.stockRepository.model.aggregate<{
      result: Stock[];
      totalCount: { count: number }[];
    }>(stockPipeLine);

    const result: SubsidiaryCountColumn[] = [];
    stockList[0].result.forEach((stock) => {
      const productItem = productMap.get(
        (stock.product as unknown as ObjectId).toHexString(),
      );
      if (!productItem) return;

      const newProduct: SubsidiaryCountColumn = {
        name: productItem.name,
        count: stock.count,
        code: productItem.code,
      };

      result.push(newProduct);
    });
    return {
      data: result,
      totalCount: stockList[0].totalCount[0]?.count ?? 0,
    };
  }

  async productCountStocks({
    keyword: productName,
    limit,
    skip,
    storageName,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    isSubsidiary = false,
  }: ProductCountStocksInput) {
    //이 창고에 있는 모든 상품을 갯수와 함께 반환
    const storage = await this.checkStorageByName(storageName);
    const productList = await this.productModel
      .find({
        $or: [
          {
            name: {
              $regex: this.utilService.escapeRegex(productName),
              $options: 'i',
            },
          },
          {
            code: {
              $regex: this.utilService.escapeRegex(productName),
              $options: 'i',
            },
          },
        ],
      })
      .lean<Product[]>();

    const productMap = new Map<string, Product>(
      productList.map((product) => [product._id.toHexString(), product]),
    );

    const productIdList = productList.map((product) => product._id);
    const stockPipeLine: PipelineStage[] = [
      {
        $match: {
          product: { $in: productIdList },
          storage: storage._id,
          // count: { $gt: 0 },
          isSubsidiary,
        },
      },
      {
        $facet: {
          result: [
            {
              $sort: {
                [sort]: order === OrderEnum.DESC ? -1 : 1,
                _id: 1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const stockList = await this.stockRepository.model.aggregate<{
      result: Stock[];
      totalCount: { count: number }[];
    }>(stockPipeLine);

    const result: ProductCountColumn[] = [];
    stockList[0].result.forEach((stock) => {
      const productItem = productMap.get(
        (stock.product as unknown as ObjectId).toHexString(),
      );
      if (!productItem) return;

      const newProduct: ProductCountColumn = {
        name: productItem.name,
        count: stock.count,
        code: productItem.code,
        salePrice: productItem.salePrice,
        wonPrice: productItem.wonPrice,
      };

      result.push(newProduct);
    });
    return {
      data: result,
      totalCount: stockList[0].totalCount[0]?.count ?? 0,
    };
  }

  async findStockByState(productName: string) {
    try {
      const product = await this.checkProductByName(productName);
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
          if (productId !== product._id.toHexString()) return;

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

  async findSubsidiaryStockByState(productName: string) {
    try {
      const product = await this.checkSubsidiaryByName(productName);
      const storageList = await this.storageModel.find({}).lean<Storage[]>();
      const stockList = await this.stockRepository.model
        .find({
          product: product._id,
          isSubsidiary: true,
        })
        .lean<Stock[]>();

      const stockValues = stockList.map((stock) => {
        const location = storageList.find(
          (item) =>
            item._id.toHexString() ==
            (stock.storage as unknown as ObjectId).toHexString(),
        );
        if (!location) return;

        const newItem: SubsidiaryStockStateOutput = {
          productName: product.name,
          count: stock.count,
          location: location.name,
          state: '보관중',
        };

        return newItem;
      });

      return stockValues;
    } catch (e) {
      console.log(e);
    }
  }

  async addWithSession({ stocks }: CreateStockInput, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.add({ stocks }, userId, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `서버에서 오류가 발생했습니다. ${error.message}`,
      );
    } finally {
      await session.endSession();
    }
  }

  async outWithSession({
    createStockInput,
    userId,
  }: {
    createStockInput: CreateStockInput;
    userId: string;
  }) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.out({ createStockInput, userId, session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `서버에서 오류가 발생했습니다. ${error.message}`,
      );
    } finally {
      await session.endSession();
    }
  }

  async add(
    { stocks }: CreateStockInput,
    userId: string,
    session?: ClientSession,
  ) {
    const productNameList = stocks
      .filter((item) => !item.isSubsidiary)
      .map((item) => item.productName);
    const productList = await this.productModel.find({
      name: { $in: productNameList },
    });
    const productByName = new Map<string, Product>(
      productList.map((item) => [item.name, item]),
    );

    const subsidiaryNameList = stocks
      .filter((item) => item.isSubsidiary)
      .map((item) => item.productName);
    const subsidiaryList = await this.subsidiaryModel.find({
      name: { $in: subsidiaryNameList },
    });
    const subsidiaryByName = new Map<string, Product>(
      subsidiaryList.map((item) => [item.name, item]),
    );

    const storageNameList = stocks.map((item) => item.storageName);
    const storageList = await this.storageModel.find({
      name: { $in: storageNameList },
    });
    const storageByName = new Map(storageList.map((item) => [item.name, item]));

    const allItemIdList = productList
      .map((item) => item.id)
      .concat(subsidiaryList.map((item) => item._id));

    const stockList = await this.stockRepository.model.find({
      product: { $in: allItemIdList },
    });

    const stockByStorageProduct = new Map<string, Stock>(
      stockList.map((item) => [
        (item.storage as unknown as string) +
          (item.product as unknown as string),
        item,
      ]),
    );

    const logs: LogInterface[] = [];

    for await (const {
      productName,
      storageName,
      count,
      isSubsidiary,
    } of stocks) {
      const product = isSubsidiary //
        ? subsidiaryByName.get(productName)
        : productByName.get(productName);

      if (!product) {
        throw new NotFoundException(`${productName}는 존재하지 않습니다.`);
      }

      const storage = storageByName.get(storageName);
      const stock = stockByStorageProduct.get(`${storage._id}${product._id}`);

      const log = this.logService.createStockLog({
        userId,
        productName,
        productCode: product.code,
        storageName,
        logType: LogTypeEnum.STOCK,
        count,
        action: '입고',
      });

      logs.push(log);

      if (session) {
        if (!stock) {
          await this.stockRepository.create(
            {
              count,
              isSubsidiary,
              product,
              storage,
            },
            session,
          );
        } else {
          await this.stockRepository.update(
            { _id: stock._id },
            {
              count: stock.count + count,
            },
            session,
          );
        }
      } else {
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

    if (logs.length) {
      await this.logService.bulkCreate({ logs, session });
    }
  }

  async saleOut({
    session,
    userId,
  }: {
    session: ClientSession;
    userId: string;
  }) {
    const startDate = dayjs().subtract(7, 'day').startOf('day').toDate();
    const endDate = dayjs().endOf('day').toDate();

    const allOutSaleList = await this.saleModel.find({
      saleAt: {
        $gte: startDate,
        $lt: endDate,
      },
      orderStatus: '출고완료',
      isOut: false,
    });

    if (allOutSaleList.length === 0) {
      throw new BadRequestException(
        '출고 할 수 있는 사방넷 판매 데이터가 없습니다.',
      );
    }

    const allProductCodeList = allOutSaleList.map((item) => item.productCode);
    const productCodeList = Array.from(new Set(allProductCodeList));
    const productList = await this.productModel
      .find({
        code: { $in: productCodeList },
      })
      .lean<Product[]>();
    const productListByCode = new Map<string, Product>(
      productList.map((p) => [p.code, p]),
    );

    const allClientCodeList = allOutSaleList.map((item) => item.mallId);
    const clientCodeList = Array.from(new Set(allClientCodeList));
    const clientList = await this.clientModel
      .find({
        name: { $in: clientCodeList },
      })
      .lean<Client[]>();
    const clientListByName = new Map<string, Client>(
      clientList.map((c) => [c.name, c]),
    );

    const storageList = await this.storageModel.find({}).lean<Storage[]>();
    const storageListById = new Map<string, Storage>(
      storageList.map((storage) => [storage._id.toHexString(), storage]),
    );

    const stockList = await this.stockRepository.model.find({
      product: { $in: productList.map((p) => p._id) },
    });
    const stockListByProductId = new Map<string, Stock>(
      stockList.map((stock) => [
        (stock.product as unknown as ObjectId).toHexString(),
        stock,
      ]),
    );
    const stockListByProductIdStorageId = new Map<string, Stock>(
      stockList.map((stock) => {
        const productId = (stock.product as unknown as ObjectId).toHexString();
        const storageId = (stock.storage as unknown as ObjectId).toHexString();
        return [`${productId}_${storageId}`, stock];
      }),
    );

    if (stockList.length === 0) {
      throw new BadRequestException(
        '출고 할 수 있는 재고가 있는 제품이 없습니다.',
      );
    }

    const hasNoCountSale: Sale[] = [];
    const hasNoProductCodeSale: Sale[] = [];
    const hasNoMatchClientSale: Sale[] = [];
    const hasNoMatchStorageSale: Sale[] = [];
    const hasNoStockSale: Sale[] = [];
    const hasNoMatchStorageProductStockSale: Sale[] = [];

    const filteredSaleList = allOutSaleList
      .filter((sale) => {
        const hasCount = !!sale?.count && sale.count > 0;
        if (!hasCount) hasNoCountSale.push(sale);
        return hasCount;
      })
      .filter((sale) => {
        const hasProductCode = productListByCode.has(sale.productCode);
        if (!hasProductCode) hasNoProductCodeSale.push(sale);
        return hasProductCode;
      })
      .filter((sale) => {
        const hasMatchClient = clientListByName.has(sale.mallId);
        if (!hasMatchClient) hasNoMatchClientSale.push(sale);
        return hasMatchClient;
      })
      .filter((sale) => {
        const targetClient = clientListByName.get(sale.mallId)!;
        const targetStorageId = targetClient.storageId;
        if (!targetStorageId) hasNoMatchStorageSale.push(sale);
        const hasStorage = storageListById.has(targetStorageId);
        if (!hasStorage) hasNoMatchStorageSale.push(sale);
        return !!targetStorageId && hasStorage;
      })
      .filter((sale) => {
        const targetProduct = productListByCode.get(sale.productCode)!;
        const productId = targetProduct._id.toHexString();
        const hasStockProduct = stockListByProductId.has(productId);
        if (!hasStockProduct) hasNoStockSale.push(sale);
        return hasStockProduct;
      })
      .filter((sale) => {
        const targetProduct = productListByCode.get(sale.productCode)!;
        const productId = targetProduct._id.toHexString();
        const targetClient = clientListByName.get(sale.mallId)!;
        const storageId = targetClient.storageId;
        const hasMatchStorageProductStock = stockListByProductIdStorageId.has(
          `${productId}_${storageId}`,
        );
        if (!hasMatchStorageProductStock) {
          hasNoMatchStorageProductStockSale.push(sale);
        }
        return hasMatchStorageProductStock;
      });

    const hasNoCountSaleMessage = this.getOutErrorMessage(
      '판매수량이 없음',
      hasNoCountSale.map(
        (sale) =>
          `주문번호 ${sale.orderNumber}인 ${this.utilService.afterCheckIsEmpty(sale.productName)}제품 ${sale.count == null ? '입력없음' : sale.count}개`,
      ),
    );

    const hasNoProductCodeSaleMessage = this.getOutErrorMessage(
      '제품코드가 백데이터에 없음',
      hasNoProductCodeSale.map((sale) =>
        this.utilService.afterCheckIsEmpty(sale.productCode),
      ),
    );

    const hasNoMatchClientSaleMessage = this.getOutErrorMessage(
      '거래처가 백데이터에 없음',
      hasNoMatchClientSale.map((sale) =>
        this.utilService.afterCheckIsEmpty(sale.mallId),
      ),
    );

    const hasNoMatchStorageSaleMessage = this.getOutErrorMessage(
      '창고가 거래처에 매핑되어 있지 않음',
      hasNoMatchStorageSale.map((sale) =>
        this.utilService.afterCheckIsEmpty(sale.mallId),
      ),
    );

    const hasNoStockSaleMessage = this.getOutErrorMessage(
      '재고가 없는 제품',
      hasNoStockSale.map((sale) => `${sale.productName}(${sale.productCode})`),
    );

    const hasNoMatchStorageProductStockSaleMessage = this.getOutErrorMessage(
      '창고에 재고가 없는 제품',
      hasNoMatchStorageProductStockSale.map((sale) => {
        const client = clientListByName.get(sale.mallId);
        const storage = storageListById.get(client.storageId);
        return `${storage.name}창고 ${sale.productName}(${sale.productCode})제품`;
      }),
    );

    const errorString = this.errorJoin(
      '\n | ',
      hasNoCountSaleMessage,
      hasNoProductCodeSaleMessage,
      hasNoMatchClientSaleMessage,
      hasNoMatchStorageSaleMessage,
      hasNoStockSaleMessage,
      hasNoMatchStorageProductStockSaleMessage,
    );

    if (filteredSaleList.length === 0) {
      throw new BadRequestException(
        '지금은 출고 가능한 제품이 없습니다. ' + errorString,
      );
    }

    const logs: LogInterface[] = [];
    const newStock: AnyBulkWriteOperation<Stock>[] = filteredSaleList.map(
      (sale) => {
        const targetProduct = productListByCode.get(sale.productCode)!;
        const productId = targetProduct._id.toHexString();
        const targetClient = clientListByName.get(sale.mallId)!;
        const storageId = targetClient.storageId;
        const stock = stockListByProductIdStorageId.get(
          `${productId}_${storageId}`,
        );
        const count = sale.count;

        const targetStorage = storageListById.get(storageId);
        const log = this.logService.createStockLog({
          userId,
          productName: targetProduct.name,
          productCode: targetProduct.code,
          storageName: targetStorage.name,
          count,
          logType: LogTypeEnum.STOCK,
        });

        logs.push(log);

        return {
          updateOne: {
            filter: { _id: stock._id },
            update: { $set: { count: stock.count - count } },
          },
        };
      },
    );

    await this.logService.bulkCreate({ logs, session });
    await this.stockRepository.model.bulkWrite(newStock, { session });
    return {
      filteredSaleList,
      errors: {
        hasNoCountSale: hasNoCountSaleMessage,
        hasNoProductCodeSale: hasNoProductCodeSaleMessage,
        hasNoMatchClientSale: hasNoMatchClientSaleMessage,
        hasNoMatchStorageSale: hasNoMatchStorageSaleMessage,
        hasNoStockSale: hasNoStockSaleMessage,
        hasNoMatchStorageProductStockSale:
          hasNoMatchStorageProductStockSaleMessage,
        totalErrors: errorString,
      },
    };
  }

  async out({
    createStockInput: { stocks },
    userId,
    session,
  }: {
    createStockInput: CreateStockInput;
    session?: ClientSession;
    userId: string;
  }) {
    const newStock: AnyBulkWriteOperation<Stock>[] = [];
    const logs: LogInterface[] = [];

    const storageNameList = stocks.map((s) => s.storageName);
    const storageList = await this.storageModel.find({
      name: { $in: storageNameList },
    });
    const storageByName = new Map<string, Storage>(
      storageList.map((s) => [s.name, s]),
    );

    const isSubsidiary = stocks[0].isSubsidiary;
    const productNameList = stocks.map((s) => s.productName);
    const productList = isSubsidiary
      ? await this.subsidiaryModel
          .find({
            name: { $in: productNameList },
          })
          .lean<Subsidiary[]>()
      : await this.productModel
          .find({
            name: { $in: productNameList },
          })
          .lean<Product[]>();
    const productByName = new Map<string, Product | Subsidiary>(
      productList.map((p) => [p.name, p] as [string, Product | Subsidiary]),
    );

    const productIdList = productList.map((item) => item._id);
    const stockList = await this.stockRepository.model.find({
      product: { $in: productIdList },
    });
    const stockByProductIdStorageId = new Map<string, Stock>(
      stockList.map((s) => {
        const productId = (s.product as unknown as ObjectId).toHexString();
        const storageId = (s.storage as unknown as ObjectId).toHexString();
        const key = `${productId}_${storageId}`;
        return [key, s];
      }),
    );

    for (const {
      productName,
      storageName,
      count,
      // isSubsidiary,
    } of stocks) {
      const product = productByName.get(productName);
      if (!product) {
        throw new NotFoundException(`${productName}는 존재하지 않습니다.`);
      }

      const storage = storageByName.get(storageName);
      if (!storage) {
        throw new NotFoundException(
          `${storageName}는 존재하지 않는 창고 입니다.`,
        );
      }

      const key = `${product._id.toHexString()}_${storage._id.toHexString()}`;
      const stock = stockByProductIdStorageId.get(key);

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

      const log = this.logService.createStockLog({
        userId,
        logType: LogTypeEnum.STOCK,
        productCode: product.code,
        storageName: storage.name,
        productName: product.name,
        count,
      });
      logs.push(log);
    }

    await this.logService.bulkCreate({ logs, session });

    if (session) {
      await this.stockRepository.model.bulkWrite(newStock, { session });
    } else {
      await this.stockRepository.model.bulkWrite(newStock);
    }
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
      $or: [
        {
          name: {
            $regex: this.utilService.escapeRegex(keyword),
            $options: 'i',
          },
        },
        {
          code: {
            $regex: this.utilService.escapeRegex(keyword),
            $options: 'i',
          },
        },
      ],
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
      .sort({ [sort]: order == OrderEnum.DESC ? -1 : 1, _id: 1 })
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
          orderStatus: '출고완료',
          mallId: { $ne: '로켓그로스' },
          productCode: { $in: productCodeList },
          count: { $exists: true },
          saleAt: {
            $exists: true,
            $gte: from.toDate(),
            $lt: to.toDate(),
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
    const saleMap = new Map(saleList.map((sale) => [sale._id, sale.accCount]));
    const data = productList.map((item) => {
      const projectId = item._id.toHexString();
      const saleItem = saleMap.get(item.code) ?? 0;
      const orderItem = orderMap.get(projectId) ?? 0;
      const stockItem = stockMap.get(projectId) ?? 0;

      const daySale = saleItem / 30;
      const leftDate = daySale == 0 ? null : Math.floor(stockItem / daySale);

      const newData: StockColumn = {
        productCode: item.code,
        wonPrice: item.wonPrice,
        leftDate: stockItem == 0 ? -1 : leftDate,
        monthSaleCount: saleItem,
        productName: item.name,
        stockCount: `${this.utilService.getNumberWithComma(stockItem)}(+${this.utilService.getNumberWithComma(orderItem)})`,
        leadTime: item.leadTime,
      };

      return newData;
    });

    const totalCount = await this.productModel.countDocuments(filterQuery);

    return { totalCount, data };
  }

  async subsidiaryFindMany({
    keyword,
    limit,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    skip,
    storageName,
  }: StocksInput) {
    type CountAggregate = { _id: string; accCount: number };

    const filterQuery: Record<string, any> = {
      name: { $regex: this.utilService.escapeRegex(keyword), $options: 'i' },
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
          isSubsidiary: true,
        })
        .lean<Stock[]>();

      const initProductIds = stocks.map((stock) => stock.product);
      filterQuery._id = { $in: initProductIds };
    }

    const subsidiaryList = await this.subsidiaryModel
      .find(filterQuery)
      .select(['_id', 'name', 'leadTime', 'wonPrice', 'productList'])
      .limit(limit)
      .skip(skip)
      .sort({ [sort]: order == OrderEnum.DESC ? -1 : 1 })
      .lean<Subsidiary[]>();

    const subsidiaryIdList = subsidiaryList.map((item) => item._id);
    const subsidiaryProductIdList = subsidiaryList.flatMap(
      (subsidiary) => subsidiary.productList,
    );
    const productList = await this.productModel
      .find({
        _id: subsidiaryProductIdList,
      })
      .lean<Product[]>();
    const productById = new Map<string, Product>(
      productList.map((item) => [item._id.toHexString(), item]),
    );

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
            product: { $in: subsidiaryIdList },
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

    const data = subsidiaryList.map((item) => {
      const productList = (item.productList ?? [])
        .map((product) => {
          const stringId =
            typeof product === 'string'
              ? product
              : (product as unknown as ObjectId).toHexString();
          const productName = productById.get(stringId)?.name;
          return productName;
        })
        .filter((item) => !!item);

      const subsidiaryId = item._id.toHexString();
      const stockItem = stockMap.get(subsidiaryId) ?? 0;
      const newData: SubsidiaryStockColumn = {
        wonPrice: item.wonPrice,
        productName: item.name,
        stockCount: `${this.utilService.getNumberWithComma(stockItem)}`,
        leadTime: item.leadTime,
        productList,
      };

      return newData;
    });
    const totalCount = await this.subsidiaryModel.countDocuments(filterQuery);

    return { totalCount, data };
  }

  private async checkProductByName(productName: string) {
    const product = await this.productModel.findOne({ name: productName });
    if (!product) {
      throw new NotFoundException(`${productName}은 존재하지 않는 제품입니다.`);
    }
    return product;
  }

  private async checkSubsidiaryByName(subsidiaryName: string) {
    const product = await this.subsidiaryModel.findOne({
      name: subsidiaryName,
    });
    if (!product) {
      throw new NotFoundException(
        `${subsidiaryName} 존재하지 않는 부자재입니다.`,
      );
    }
    return product;
  }

  private async checkStorageByName(storageName: string) {
    const storage = await this.storageModel.findOne({ name: storageName });
    if (!storage) {
      throw new NotFoundException(`${storageName} 존재하지 않는 창고입니다.`);
    }
    return storage;
  }

  private getOutErrorMessage(title: string, errorMessages: string[]) {
    if (errorMessages.length == 0) return '';

    return title + ' ' + Array.from(new Set(errorMessages)).join(', ') + '\n';
  }

  private errorJoin(seprator: string, ...errors: string[]) {
    return errors
      .filter((error) => !!error.trim())
      .join(seprator)
      .trim()
      .replace(/\|$/, '');
  }
}
