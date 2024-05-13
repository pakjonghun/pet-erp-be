import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Factory } from './entities/factory.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class FactoryRepository extends AbstractRepository<Factory> {
  logger = new Logger(FactoryRepository.name);
  constructor(@InjectModel(Factory.name) factoryModel: Model<Factory>) {
    super(factoryModel);
  }
}
