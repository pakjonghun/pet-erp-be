import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientResolver } from './client.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Client, clientSchema } from './entities/client.entity';
import { ClientRepository } from './client.repository';
import { SaleModule } from 'src/sale/sale.module';
import { Sale, saleSchema } from 'src/sale/entities/sale.entity';
import { Storage, StorageSchema } from 'src/storage/entities/storage.entity';
import { ClientLoader } from './client.loader';
import { Product, productSchema } from 'src/product/entities/product.entity';
import { ClientOutResolver } from './client.out.resolver';

@Module({
  exports: [ClientService, ClientLoader],
  imports: [
    SaleModule,
    DatabaseModule.forFeature([
      { name: Client.name, schema: clientSchema },
      { name: Sale.name, schema: saleSchema },
      { name: Storage.name, schema: StorageSchema },
      { name: Product.name, schema: productSchema },
    ]),
  ],
  providers: [
    ClientOutResolver,
    ClientResolver,
    ClientService,
    ClientRepository,
    ClientLoader,
  ],
})
export class ClientModule {}
