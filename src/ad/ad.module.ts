import { Module } from '@nestjs/common';
import { AdService } from './ad.service';
import { FactoryResolver } from './ad.resolver';
import { AdRepository } from './ad.repository';
import { DatabaseModule } from 'src/common/database/database.module';
import { Ad, adSchema } from './entities/ad.entity';
import { Product, productSchema } from 'src/product/entities/product.entity';
import { AdClientLoader } from './ad-client.loader';
import { AdProductLoader } from './ad-product.loader';
import { Client, clientSchema } from 'src/client/entities/client.entity';

@Module({
  imports: [
    DatabaseModule.forFeature([
      {
        name: Ad.name,
        schema: adSchema,
      },
      {
        name: Client.name,
        schema: clientSchema,
      },
      {
        name: Product.name,
        schema: productSchema,
      },
    ]),
  ],
  providers: [
    FactoryResolver,
    AdService,
    AdRepository,
    AdClientLoader,
    AdProductLoader,
  ],
  exports: [AdService, AdProductLoader, AdClientLoader],
})
export class AdModule {}
