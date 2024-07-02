import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sale } from './entities/sale.entity';
import { HydratedDocument, Model, FilterQuery } from 'mongoose';
import { Product } from 'src/product/entities/product.entity';
import { Client } from 'src/client/entities/client.entity';
import { Storage } from 'src/storage/entities/storage.entity';

@Injectable()
export class SaleRepository {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Sale.name) public readonly saleModel: Model<Sale>,
  ) {}

  async bulkUpsert(documents: HydratedDocument<Sale>[]) {
    this.saleModel.bulkWrite(
      documents.map((item) => ({
        updateOne: {
          filter: { code: item.code },
          update: { $set: item },
          upsert: true,
        },
      })),
    );
  }

  get emptyDocument() {
    return new this.saleModel();
  }

  async findMany(query: FilterQuery<Sale>, select?: string[]) {
    return this.saleModel
      .find(query)
      .select(select)
      .lean<Pick<Sale, 'orderNumber' | 'productCode'>[]>();
  }

  async findManyClient(query: FilterQuery<Client>, select?: string[]) {
    return this.clientModel
      .find(query)
      .select(select)
      .lean<Pick<Client, 'storageId' | 'name'>[]>();
  }

  async findManyProduct(query: FilterQuery<Product>, select?: string[]) {
    return this.productModel
      .find(query)
      .select(select)
      .lean<Pick<Product, 'storageId' | 'name' | 'code'>[]>();
  }

  async findManyStorage(query: FilterQuery<Storage>) {
    return this.storageModel.find(query).lean<Storage[]>();
  }
}
