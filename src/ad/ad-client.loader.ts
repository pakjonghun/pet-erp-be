import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from 'src/client/entities/client.entity';
import * as DataLoader from 'dataloader';
import { ProductCodeName } from 'src/client/dtos/clients.output';

@Injectable()
export class AdClientLoader {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
  ) {}

  createLoader(): DataLoader<string, ProductCodeName> {
    return new DataLoader(async (clientId) => {
      const clients = await this.clientModel
        .find({
          _id: clientId,
        })
        .select(['-_id', 'code', 'name'])
        .lean<ProductCodeName[]>();

      const clientMap = new Map<string, ProductCodeName>();

      clients.forEach((client) => {
        if (!clientMap.has(client.code)) {
          clientMap.set(client.code, client);
        }
      });

      return clients.map((client) => clientMap.get(client.code));
    });
  }
}
