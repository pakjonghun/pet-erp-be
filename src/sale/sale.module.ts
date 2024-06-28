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
import { Product, productSchema } from 'src/product/entities/product.entity';
import { Stock, StockSchema } from 'src/stock/entities/stock.entity';
import { StockModule } from 'src/stock/stock.module';

@Module({
  exports: [SaleService],
  imports: [
    DatabaseModule.forFeature([
      { name: Product.name, schema: productSchema },
      { name: Client.name, schema: clientSchema },
      { name: Sale.name, schema: saleSchema },
      { name: Stock.name, schema: StockSchema },
      { name: DeliveryCost.name, schema: DeliveryCostSchema },
    ]),
    StockModule,
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
