import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sale } from './entities/sale.entity';
import { HydratedDocument, Model } from 'mongoose';

@Injectable()
export class SaleRepository {
  constructor(@InjectModel(Sale.name) public readonly saleModel: Model<Sale>) {}

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
}
