import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Subsidiary } from 'src/subsidiary/entities/subsidiary.entity';

@Injectable()
export class ProductSubsidiaryRepository extends AbstractRepository<Subsidiary> {
  logger = new Logger(ProductSubsidiaryRepository.name);

  constructor(@InjectModel(Subsidiary.name) model: Model<Subsidiary>) {
    super(model);
  }
}
