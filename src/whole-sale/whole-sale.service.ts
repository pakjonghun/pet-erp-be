import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateWholeSaleInput,
  CreateWholeSaleProduct,
} from './dto/create-whole-sale.input';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';
import { WholeSaleRepository } from './whole-sale.repository';
import { Sale, SaleInterface } from 'src/sale/entities/sale.entity';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Storage } from 'src/storage/entities/storage.entity';
import {
  AnyBulkWriteOperation,
  ClientSession,
  Connection,
  Model,
  PipelineStage,
  Types,
} from 'mongoose';
import { Client } from 'src/client/entities/client.entity';
import { Product } from 'src/product/entities/product.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import { WholeSalesInput } from './dto/whole-sales.input';
import { UtilService } from 'src/util/util.service';
import { WholeSaleItem } from './dto/whole-sales.output';
import { StockService } from 'src/stock/stock.service';
import { CreateSingleStockInput } from 'src/stock/dto/create-stock.input';
import * as uuid from 'uuid';
import { DeliveryCost } from 'src/sale/entities/delivery.entity';

@Injectable()
export class WholeSaleService {
  constructor(
    private readonly utilService: UtilService,
    private readonly wholeSaleRepository: WholeSaleRepository,
    private readonly stockService: StockService,
    @InjectModel(DeliveryCost.name)
    private readonly deliveryCostModel: Model<DeliveryCost>,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createWholeSale(
    {
      productList,
      mallId,
      saleAt,
      telephoneNumber1,
      isDone,
      deliveryBoxCount = 1,
    }: CreateWholeSaleInput,
    session: ClientSession,
    isEdit = false,
  ) {
    const client = await this.clientModel.findOne({ name: mallId });
    if (!client) {
      throw new NotFoundException(`${mallId} 는 존재하지 않는 거래처 입니다.`);
    }

    const productNameList = productList.map((product) => product.productName);
    const productDocList = await this.productModel
      .find({
        name: { $in: productNameList },
      })
      .lean<Product[]>();

    if (productNameList.length !== productDocList.length) {
      throw new NotFoundException('존재하지 않는 제품이 있습니다.');
    }

    const storageNameList = productList.map((product) => product.storageName);
    const storageDocList = await this.storageModel
      .find({
        name: { $in: storageNameList },
      })
      .lean<Product[]>();
    const storageSet = new Set(storageNameList);
    if (storageSet.size !== storageDocList.length) {
      throw new NotFoundException('존재하지 않는 창고가 있습니다.');
    }

    const saleDocList: AnyBulkWriteOperation<Sale>[] = [];
    const stockDocList: AnyBulkWriteOperation<Stock>[] = [];
    const wholeSaleId = uuid.v4();

    const deliveryCostDocs = await this.deliveryCostModel
      .find({})
      .lean<DeliveryCost[]>();
    const deliveryCost = deliveryCostDocs?.[0]?.deliveryCost ?? 0;

    for await (const {
      count,
      payCost,
      productCode,
      productName,
      storageName,
      wonCost,
    } of productList) {
      const targetProduct = productDocList.find(
        (item) => item.name === productName,
      );
      const targetStorage = storageDocList.find(
        (item) => item.name === storageName,
      );
      if (!targetProduct || !targetStorage) continue;

      const stockDoc = await this.stockModel
        .findOne({
          storage: targetStorage._id,
          product: targetProduct._id,
        })
        .lean<Stock>();

      if (!stockDoc) {
        throw new NotFoundException(
          `${storageName}에 ${productName}제품이 존재하지 않습니다.`,
        );
      }

      if (!isEdit && stockDoc.count < count) {
        throw new ConflictException(
          `${storageName}에 ${productName}재고가 부족합니다. 남은재고 ${stockDoc.count}`,
        );
      }

      //재고를 출고 시킨다.
      //트랜젝션이 필요함.
      stockDocList.push({
        updateOne: {
          filter: {
            _id: stockDoc._id,
          },
          update: { $inc: { count: -count } },
        },
      });

      const newWholeSale: SaleInterface = {
        code: uuid.v4(),
        count,
        telephoneNumber1,
        productName,
        productCode,
        saleAt,
        payCost: payCost * count,
        mallId,
        wonCost: wonCost * count,
        wholeSaleId,
        storageId: targetStorage._id.toHexString(),
        isDone,
        deliveryBoxCount,
        deliveryCost: (deliveryCost * deliveryCost) / productList.length,
      };
      const saleItem = new this.wholeSaleRepository.model(newWholeSale);
      saleDocList.push({
        insertOne: {
          document: saleItem,
        },
      });
    }

    await this.wholeSaleRepository.model.bulkWrite(saleDocList, { session });
    await this.stockModel.bulkWrite(stockDocList, { session });
    return wholeSaleId;
  }

  async create(createWholeSaleInput: CreateWholeSaleInput) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.createWholeSale(createWholeSaleInput, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `서버 오류가 발생했습니다. ${error.message} `,
      );
    } finally {
      await session.endSession();
    }
  }

  async findAll({ from, to, keyword, limit, skip }: WholeSalesInput) {
    const filterQuery: Record<string, any> = {
      wholeSaleId: { $exists: true },
      storageId: { $exists: true },
      productName: {
        $regex: this.utilService.escapeRegex(keyword),
        $options: 'i',
      },
    };

    if (from && to) {
      filterQuery.saleAt = {
        $gte: from,
        $lte: to,
      };
    }

    if (from && !to) {
      filterQuery.saleAt = {
        $gte: from,
      };
    }

    if (!from && to) {
      filterQuery.saleAt = {
        $lte: to,
      };
    }

    const salePipeLine: PipelineStage[] = [
      {
        $match: filterQuery,
      },
      {
        $facet: {
          data: [
            {
              $addFields: {
                storageObjectId: {
                  $convert: {
                    input: '$storageId',
                    to: 'objectId',
                    onError: null,
                    onNull: null,
                  },
                },
              },
            },
            {
              $lookup: {
                from: 'storages',
                localField: 'storageObjectId',
                foreignField: '_id',
                as: 'storage_info',
              },
            },
            {
              $unwind: '$storage_info',
            },
            {
              $group: {
                _id: '$wholeSaleId',
                mallId: { $first: '$mallId' },
                saleAt: { $first: '$saleAt' },
                telephoneNumber1: { $first: '$telephoneNumber1' },
                isDone: { $first: '$isDone' },
                deliveryCost: {
                  $sum: {
                    $cond: {
                      if: { $ifNull: ['$deliveryBoxCount', false] },
                      then: '$deliveryCost',
                      else: 0,
                    },
                  },
                },
                deliveryBoxCount: {
                  $first: {
                    $cond: {
                      if: { $ifNull: ['$deliveryBoxCount', false] },
                      then: '$deliveryBoxCount',
                      else: 1,
                    },
                  },
                },

                productList: {
                  $push: {
                    storageName: '$storage_info.name',
                    productName: '$productName',
                    productCode: '$productCode',
                    count: '$count',
                    payCost: '$payCost',
                    wonCost: '$wonCost',
                  },
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
                _id: 1,
              },
            },
            {
              $limit: limit,
            },
            {
              $skip: skip,
            },
          ],
          totalCount: [
            {
              $match: filterQuery, // 동일한 필터 조건을 사용하여 전체 문서 수를 계산
            },
            {
              $group: {
                _id: '$wholeSaleId',
              },
            },
            {
              $count: 'count', // 문서의 총 개수를 세고 count 필드로 반환
            },
          ],
        },
      },
    ];

    const sales = await this.wholeSaleRepository.model.aggregate<{
      data: WholeSaleItem[];
      totalCount: { count: number }[];
    }>(salePipeLine);

    return {
      data: sales[0].data,
      totalCount: sales[0].totalCount[0]?.count ?? 0,
    };
  }

  async findOne(wholeSaleId: string) {
    const filterQuery: Record<string, any> = {
      wholeSaleId,
    };

    const salePipeLine: PipelineStage[] = [
      {
        $match: filterQuery,
      },
      {
        $facet: {
          data: [
            {
              $addFields: {
                storageObjectId: {
                  $convert: {
                    input: '$storageId',
                    to: 'objectId',
                    onError: null,
                    onNull: null,
                  },
                },
              },
            },
            {
              $lookup: {
                from: 'storages',
                localField: 'storageObjectId',
                foreignField: '_id',
                as: 'storage_info',
              },
            },
            {
              $unwind: '$storage_info',
            },
            {
              $group: {
                _id: '$wholeSaleId',
                mallId: { $first: '$mallId' },
                saleAt: { $first: '$saleAt' },
                telephoneNumber1: { $first: '$telephoneNumber1' },
                isDone: { $first: '$isDone' },
                deliveryCost: {
                  $sum: {
                    $cond: {
                      if: { $ifNull: ['$deliveryBoxCount', false] },
                      then: '$deliveryCost',
                      else: 0,
                    },
                  },
                },
                deliveryBoxCount: {
                  $first: {
                    $cond: {
                      if: { $ifNull: ['$deliveryBoxCount', false] },
                      then: '$deliveryBoxCount',
                      else: 1,
                    },
                  },
                },
                productList: {
                  $push: {
                    storageName: '$storage_info.name',
                    productName: '$productName',
                    productCode: '$productCode',
                    count: '$count',
                    payCost: '$payCost',
                    wonCost: '$wonCost',
                  },
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
                _id: 1,
              },
            },
          ],
        },
      },
    ];

    const sales = await this.wholeSaleRepository.model.aggregate<{
      data: WholeSaleItem[];
    }>(salePipeLine);

    return sales[0].data;
  }

  async update(
    {
      wholeSaleId,
      mallId,
      productList: curProductList,
      saleAt,
      telephoneNumber1,
      isDone,
      deliveryBoxCount = 1,
    }: UpdateWholeSaleInput,
    userId: string,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // 제품 코드 제품 이름 날짜 모든게 다 바뀔수 있음. 생성, 삭제 업데이트 할 것을 구분 할 수 없음.
      // 모두 지우고 새로 온 아이템으로 새로 만들어야 함.
      const prevWholeSale = await this.findOne(wholeSaleId);
      if (!Array.isArray(prevWholeSale) || !prevWholeSale[0]) {
        throw new BadRequestException('해당 도매판매는 존재하지 않습니다.');
      }

      const prevProductMapByCode = new Map<string, CreateWholeSaleProduct>();
      const prevProductList = prevWholeSale[0].productList;
      prevProductList.forEach((item) => {
        prevProductMapByCode.set(item.productCode, item);
      });

      //창고가 같고 제품도 같은 것들만 추려내서
      //count 가 줄었으면 통과
      //count 가 늘었으면 현재 재고를 찾아서 현재 재고 + 이전 count 보다 새로운 count 가 크면 오류를 띄운다.
      const shouldCheckList = curProductList.filter((item) => {
        const prevProduct = prevProductMapByCode.get(item.productCode);
        if (!prevProduct) return;

        const isSameStorage = prevProduct.storageName == item.storageName;
        const isIncrease = prevProduct.count < item.count;
        return isIncrease && isSameStorage;
      });

      if (shouldCheckList.length) {
        const storageNameList = shouldCheckList.map((item) => item.storageName);
        const storageList = await this.storageModel
          .find({
            name: { $in: storageNameList },
          })
          .lean<Storage[]>();

        const storageMapByName = new Map<string, Storage>();
        storageList.forEach((item) => {
          storageMapByName.set(item.name, item);
        });

        const productNameList = shouldCheckList.map((item) => item.productName);
        const productList = await this.productModel
          .find({
            name: { $in: productNameList },
          })
          .lean<Product[]>();
        const productMapByName = new Map<string, Product>();
        productList.forEach((item) => productMapByName.set(item.name, item));

        for await (const product of shouldCheckList) {
          const targetStorage = storageMapByName.get(product.storageName)._id;
          if (!targetStorage) {
            throw new BadRequestException(
              `${product.storageName}은 존재하지 않는 창고입니다.`,
            );
          }

          const targetProduct = productMapByName.get(product.productName)._id;
          if (!targetProduct) {
            throw new BadRequestException(
              `${product.productName}은 존재하지 않는 제품입니다.`,
            );
          }

          const stock = await this.stockModel
            .findOne({
              storage: targetStorage,
              product: targetProduct,
            })
            .lean<Stock>();

          if (!stock) {
            throw new BadRequestException('재고가 존재하지 않습니다.');
          }

          const prevProduct = prevProductMapByCode.get(product.productCode);

          if (stock.count + prevProduct.count < product.count) {
            throw new BadRequestException(
              `${product.productName} 제품의 판매가능 재고는 ${stock.count + prevProduct.count}이하입니다.`,
            );
          }
        }
      }

      await this.remove(wholeSaleId, userId, session);
      const newWholeSaleId = await this.createWholeSale(
        {
          isDone,
          saleAt,
          mallId,
          telephoneNumber1,
          productList: curProductList,
          deliveryBoxCount,
        },
        session,
        true,
      );

      await session.commitTransaction();
      const updateOne = await this.findOne(newWholeSaleId);
      return updateOne;
    } catch (err) {
      const errorMessage = err.message;
      await session.abortTransaction();
      throw new BadRequestException(
        errorMessage ?? '서버에서 오류가 발생 했습니다.',
      );
    } finally {
      await session.endSession();
    }
  }

  async removeAllWholeSaleById(wholeSaleId: string, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.remove(wholeSaleId, userId, session);
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

  async remove(wholeSaleId: string, userId: string, session: ClientSession) {
    const stockList = await this.salesToStocks(wholeSaleId);
    await this.stockService.add({ stocks: stockList }, userId, session);
    await this.wholeSaleRepository.model.deleteMany(
      { wholeSaleId },
      { session },
    );
  }

  private async wholeSales(wholeSaleId: string) {
    const wholeSaleList = await this.wholeSaleRepository.model
      .find({
        wholeSaleId,
      })
      .lean<Sale[]>();

    if (wholeSaleList.length == 0) {
      throw new NotFoundException('해당 도매 판매데이터를 찾을 수 없습니다.');
    }

    return wholeSaleList;
  }

  private async salesToStocks(wholeSaleId: string) {
    const wholeSaleList = await this.wholeSales(wholeSaleId);
    const storageIdList = wholeSaleList.map((sale) => sale.storageId);

    const storageList = await this.storageModel
      .find({
        _id: { $in: storageIdList.map((item) => new Types.ObjectId(item)) },
      })
      .lean<Storage[]>();
    const storageById = new Map<string, Storage>(
      storageList.map((storage) => [storage._id.toHexString(), storage]),
    );

    if (storageList.length !== new Set(storageIdList).size) {
      throw new BadRequestException(
        '존재하지 않는 창고가 있습니다. 입력된 창고 현황을 확인해 주세요.',
      );
    }

    const stockList = wholeSaleList.map((item) => {
      const createStock: CreateSingleStockInput = {
        productName: item.productName,
        storageName: storageById.get(item.storageId).name,
        count: item.count,
        isSubsidiary: false,
      };

      return createStock;
    });

    return stockList;
  }
}
