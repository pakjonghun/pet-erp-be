import { Storage } from './entities/storage.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';

@Injectable()
export class StorageRepository extends AbstractRepository<Storage> {
  logger = new Logger(StorageRepository.name);

  constructor(@InjectModel(Storage.name) storageModel: Model<Storage>) {
    super(storageModel);
  }
}
