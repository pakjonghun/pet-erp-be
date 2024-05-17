import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';
import { WholeSaleRepository } from './whole-sale.repository';
import { Sale, SaleInterface } from 'src/sale/entities/sale.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Storage } from 'src/storage/entities/storage.entity';
import { AnyBulkWriteOperation, Model, PipelineStage } from 'mongoose';
import { Client } from 'src/client/entities/client.entity';
import { Product } from 'src/product/entities/product.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import * as uuid from 'uuid';

@Injectable()
export class WholeSaleService {
  constructor(
    private readonly wholeSaleRepository: WholeSaleRepository,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
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
        name: { $in: productNameList },
      })
      .lean<Product[]>();

    if (storageNameList.length !== storageDocList.length) {
      throw new NotFoundException('존재하지 않는 창고가 있습니다.');
    }

    const saleDocList: AnyBulkWriteOperation<Sale>[] = [];
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
  }

  async findAll() {
    const result = await this.wholeSaleRepository.model
      .find({
        wholeSaleId: { $exists: true },
      })
      .sort({ wholeSaleId: 1, createdAt: -1 });

    return result;
  }

  findOne(id: string) {
    return `This action returns a #${id} wholeSale`;
  }

  update(updateWholeSaleInput: UpdateWholeSaleInput) {
    return `This action updates a  wholeSale`;
  }

  remove(id: number) {
    return `This action removes a #${id} wholeSale`;
  }
}
