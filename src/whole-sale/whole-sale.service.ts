import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';
import { WholeSaleRepository } from './whole-sale.repository';
import { Sale, SaleInterface } from 'src/sale/entities/sale.entity';
import * as uuid from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Storage } from 'src/storage/entities/storage.entity';
import { AnyBulkWriteOperation, Model } from 'mongoose';
import { Client } from 'src/client/entities/client.entity';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class WholeSaleService {
  constructor(
    private readonly wholeSaleRepository: WholeSaleRepository,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
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

    const newWholeSaleList: AnyBulkWriteOperation<Sale>[] = [];
    for await (const {
      count,
      payCost,
      productCode,
      productName,
      storageName,
      wonCost,
    } of productList) {
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
        // deliveryCost?: number,
      };

      // newWholeSaleList.push({
      //   updateOne: {
      //     filter: { _id: stock._id },
      //     update: { $set: { count: stock.count - count } },
      //   },
      // });
    }

    return 'This action adds a new wholeSale';
  }

  findAll() {
    return `This action returns all wholeSale`;
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
