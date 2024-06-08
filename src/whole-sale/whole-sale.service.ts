import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';
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

@Injectable()
export class WholeSaleService {
  constructor(
    private readonly utilService: UtilService,
    private readonly wholeSaleRepository: WholeSaleRepository,
    private readonly stockService: StockService,
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
    }: CreateWholeSaleInput,
    session: ClientSession,
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

      if (stockDoc.count < count) {
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
        // deliveryCost?: number,
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

  async update({
    wholeSaleId,
    mallId,
    productList: curProductList,
    saleAt,
    telephoneNumber1,
    isDone,
  }: UpdateWholeSaleInput) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // 제품 코드 제품 이름 날짜 모든게 다 바뀔수 있음. 생성, 삭제 업데이트 할 것을 구분 할 수 없음.
      // 모두 지우고 새로 온 아이템으로 새로 만들어야 함.
      await this.remove(wholeSaleId, session);
      const newWholeSaleId = await this.createWholeSale(
        {
          isDone,
          saleAt,
          mallId,
          telephoneNumber1,
          productList: curProductList,
        },
        session,
      );
      await session.commitTransaction();
      const updateOne = await this.findOne(newWholeSaleId);
      console.log('updateOne', updateOne);
      return updateOne;
    } catch (err) {
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async removeAllWholeSaleById(wholeSaleId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.remove(wholeSaleId, session);
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

  async remove(wholeSaleId: string, session: ClientSession) {
    const stockList = await this.salesToStocks(wholeSaleId);
    await this.stockService.add({ stocks: stockList }, session);
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
