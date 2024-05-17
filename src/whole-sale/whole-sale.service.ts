import {
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
import { AnyBulkWriteOperation, Connection, Model } from 'mongoose';
import { Client } from 'src/client/entities/client.entity';
import { Product } from 'src/product/entities/product.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import * as uuid from 'uuid';
import { WholeSalesInput } from './dto/whole-sales.input';
import { UtilService } from 'src/util/util.service';

@Injectable()
export class WholeSaleService {
  constructor(
    private readonly utilService: UtilService,
    private readonly wholeSaleRepository: WholeSaleRepository,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create({
    productList,
    mallId,
    saleAt,
    telephoneNumber1,
  }: CreateWholeSaleInput) {
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

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
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
          payCost,
          mallId,
          wonCost,
          wholeSaleId,
          // deliveryCost?: number,
        };

        const saleItem = new this.wholeSaleRepository.model(newWholeSale);
        saleDocList.push({
          insertOne: {
            document: saleItem,
          },
        });
      }

      await this.wholeSaleRepository.model.bulkWrite(saleDocList);
      await this.stockModel.bulkWrite(stockDocList);
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

    const result = await this.wholeSaleRepository.model
      .find()
      .sort({ wholeSaleId: 1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean<Sale[]>();

    return result;
  }

  async update({
    wholeSaleId,
    mallId,
    productList,
    saleAt,
    telephoneNumber1,
  }: UpdateWholeSaleInput) {
    //일단 다 찾는다.
    const wholeSaleList = await this.wholeSaleRepository.model
      .find({
        wholeSaleId,
      })
      .lean<Sale[]>();

    if (wholeSaleList.length == 0) {
      throw new NotFoundException('해당 도매 판매데이터를 찾을 수 없습니다.');
    }

    //삭제, 생성, 업데이트, 변동없는것 을 구분한다.
    const prevSaleMapByCode = new Map<string, Sale>(
      wholeSaleList.map((sale) => [sale.code, sale]),
    );

    const updateWholeSaleList = productList.map(({ productCode, ...rest }) => [
      productCode,
      {
        ...rest,
        code: productCode,
        mallId,
        saleAt,
        telephoneNumber1,
      } as unknown as Sale,
    ]) as [string, Sale][];

    const updateSaleByCode = new Map<string, Sale>(updateWholeSaleList);

    const createMap = new Map<string, any>();
    const updateMap = new Map<string, any>();
    const deleteMap = new Map<string, any>();

    const createWholeSaleList = wholeSaleList.filter(
      (item) => !prevSaleMapByCode.has(item.code),
    );
    const deleteWholeSaleList = wholeSaleList.filter(
      (item) => !updateSaleByCode.has(item.code),
    );

    const prevMallId = wholeSaleList[0].mallId;
    const prevSaleAt = wholeSaleList[0].saleAt;
    const prevPhone = wholeSaleList[0].telephoneNumber1;

    //삭제 생성 업데이트를 진행해 준다.
  }

  async remove(wholeSaleId: string) {
    await this.wholeSaleRepository.model.deleteMany({ wholeSaleId });
  }
}
