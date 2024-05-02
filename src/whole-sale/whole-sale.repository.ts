import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Sale } from 'src/sale/entities/sale.entity';

@Injectable()
export class WholeSaleRepository extends AbstractRepository<Sale> {
  logger = new Logger(WholeSaleRepository.name);

  constructor(@InjectModel(Sale.name) saleModel: Model<Sale>) {
    super(saleModel);
  }
}
