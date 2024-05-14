import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientResolver } from './client.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Client, clientSchema } from './entities/client.entity';
import { ClientRepository } from './client.repository';
import { SaleModule } from 'src/sale/sale.module';

@Module({
  exports: [ClientService],
  imports: [
    SaleModule,
    DatabaseModule.forFeature([{ name: Client.name, schema: clientSchema }]),
  ],
  providers: [ClientResolver, ClientService, ClientRepository],
})
export class ClientModule {}
