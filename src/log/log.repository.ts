import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Log } from './entities/log.entity';
import { Model } from 'mongoose';

@Injectable()
export class LogRepository extends AbstractRepository<Log> {
  protected readonly logger = new Logger(LogRepository.name);
  constructor(@InjectModel(Log.name) model: Model<Log>) {
    super(model);
  }
}
