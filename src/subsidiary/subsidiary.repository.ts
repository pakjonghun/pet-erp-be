import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Subsidiary } from './entities/subsidiary.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SubsidiaryRepository extends AbstractRepository<Subsidiary> {
  protected readonly logger = new Logger(SubsidiaryRepository.name);

  constructor(
    @InjectModel(Subsidiary.name) subsidiaryModel: Model<Subsidiary>,
  ) {
    super(subsidiaryModel);
  }
}
