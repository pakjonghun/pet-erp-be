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
import { Ad, adSchema } from 'src/ad/entities/ad.entity';
import { ClientDashboardView } from 'src/common/virtualView/ClientDashboardView/ClientDashboardView';
import { clientDashboardSchema } from 'src/common/virtualView/ClientDashboardView/ClientDashboardViewSchema';
import {
  ProductRate,
  productRateSchema,
} from 'src/common/entities/product-rate.entity';
import {
  ClientProductRate,
  clientProductRateSchema,
} from 'src/common/entities/client-product-rate.entity';
import { AdModule } from 'src/ad/ad.module';

@Module({
  exports: [ClientService, ClientLoader],
  imports: [
    AdModule,
    SaleModule,
    DatabaseModule.forFeature([
      { name: ClientProductRate.name, schema: clientProductRateSchema },
      { name: ProductRate.name, schema: productRateSchema },
      { name: ClientDashboardView.name, schema: clientDashboardSchema },
      { name: Client.name, schema: clientSchema },
      { name: Sale.name, schema: saleSchema },
      { name: Storage.name, schema: StorageSchema },
      { name: Product.name, schema: productSchema },
      { name: Ad.name, schema: adSchema },
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
