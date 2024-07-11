import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Option } from './entities/option.entity';

@Injectable()
export class OptionRepository extends AbstractRepository<Option> {
  logger = new Logger(Option.name);
  constructor(@InjectModel(Option.name) optionModel: Model<Option>) {
    super(optionModel);
  }
}
