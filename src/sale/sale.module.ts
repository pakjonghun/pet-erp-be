import { Module, forwardRef } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { Sale, saleSchema } from './entities/sale.entity';
import { AppModule } from 'src/app.module';
import { AwsS3Service } from './aws.service';
import { SaleRepository } from './sale.repository';
import { SabandService } from './sabang.service';

@Module({
  exports: [SaleService],
  imports: [
    DatabaseModule.forFeature([{ name: Sale.name, schema: saleSchema }]),
    forwardRef(() => AppModule),
  ],
  controllers: [SaleController],
  providers: [SaleService, AwsS3Service, SaleRepository, SabandService],
})
export class SaleModule {}
