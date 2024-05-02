import { saleSchema } from './../sale/entities/sale.entity';
import { Module } from '@nestjs/common';
import { WholeSaleService } from './whole-sale.service';
import { WholeSaleResolver } from './whole-sale.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Sale } from 'src/sale/entities/sale.entity';
import { WholeSaleRepository } from './whole-sale.repository';

@Module({
  imports: [
    DatabaseModule.forFeature([{ name: Sale.name, schema: saleSchema }]),
  ],
  providers: [WholeSaleResolver, WholeSaleService, WholeSaleRepository],
})
export class WholeSaleModule {}
