import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ad } from './entities/ad.entity';

@Injectable()
export class AdRepository extends AbstractRepository<Ad> {
  logger = new Logger(AdRepository.name);
  constructor(@InjectModel(Ad.name) factoryModel: Model<Ad>) {
    super(factoryModel);
  }
}
