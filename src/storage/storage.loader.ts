import { Storage } from './entities/storage.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as DataLoader from 'dataloader';
import { Model } from 'mongoose';

@Injectable()
export class StorageLoader {
  constructor(
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
  ) {}

  createLoader(): DataLoader<string, Storage> {
    return new DataLoader(async (storageIds: string[]) => {
      const storages = await this.storageModel.find({
        _id: { $in: storageIds },
      });
      const storageMap = new Map(
        storages.map((storage) => [storage._id.toHexString(), storage]),
      );

      return storageIds.map((storageId) => storageMap.get(storageId));
    });
  }
}
