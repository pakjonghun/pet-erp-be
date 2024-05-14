import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Factory } from 'src/factory/entities/factory.entity';
import * as DataLoader from 'dataloader';

@Injectable()
export class FactoryLoader {
  constructor(
    @InjectModel(Factory.name) private readonly factoryModel: Model<Factory>,
  ) {}

  createLoader(): DataLoader<string, Factory> {
    return new DataLoader(async (factoryIds) => {
      const factories = await this.factoryModel.find({
        _id: {
          $in: factoryIds.map(
            (factoryId) => new mongoose.Types.ObjectId(factoryId),
          ),
        },
      });
      const factoryMap = new Map<string, Factory>();

      factories.forEach((factory) => {
        if (!factoryMap.has(factory._id.toHexString())) {
          factoryMap.set(factory._id.toHexString(), factory);
        }
      });

      return factories.map((factory) =>
        factoryMap.get(factory._id.toHexString()),
      );
    });
  }
}
