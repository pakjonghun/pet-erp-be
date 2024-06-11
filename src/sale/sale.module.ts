import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { DatabaseModule } from 'src/common/database/database.module';
import { Sale, saleSchema } from './entities/sale.entity';
import { AwsS3Service } from './aws.service';
import { SaleRepository } from './sale.repository';
import { SabandService } from './sabang.service';
import { SaleResolver } from './sale.resolver';
import { DeliveryCost, DeliveryCostSchema } from './entities/delivery.entity';
import { Client, clientSchema } from 'src/client/entities/client.entity';

@Module({
  exports: [SaleService],
  imports: [
    DatabaseModule.forFeature([
      { name: Client.name, schema: clientSchema },
      { name: Sale.name, schema: saleSchema },
      { name: DeliveryCost.name, schema: DeliveryCostSchema },
    ]),
  ],
  providers: [
    SaleResolver,
    SaleService,
    AwsS3Service,
    SaleRepository,
    SabandService,
  ],
})
export class SaleModule {}
