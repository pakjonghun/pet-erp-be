import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Client } from './entities/client.entity';
import { Model } from 'mongoose';

@Injectable()
export class ClientRepository extends AbstractRepository<Client> {
  logger = new Logger(ClientRepository.name);

  constructor(@InjectModel(Client.name) clientModel: Model<Client>) {
    super(clientModel);
  }
}
