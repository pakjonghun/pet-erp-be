import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Stock } from './entities/stock.entity';
import { Model } from 'mongoose';

@Injectable()
export class StockRepository extends AbstractRepository<Stock> {
  logger = new Logger(StockRepository.name);
  constructor(@InjectModel(Stock.name) stockModel: Model<Stock>) {
    super(stockModel);
  }
}
