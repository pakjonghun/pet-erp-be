import { DatabaseModule } from './../common/database/database.module';
import { Module, forwardRef } from '@nestjs/common';
import { SubsidiaryService } from './subsidiary.service';
import { SubsidiaryResolver } from './subsidiary.resolver';
import { Subsidiary, SubsidiarySchema } from './entities/subsidiary.entity';
import { SubsidiaryRepository } from './subsidiary.repository';
import { ProductModule } from 'src/product/product.module';
import { SubsidiaryCategoryModule } from 'src/subsidiary-category/subsidiary-category.module';
import { Stock, StockSchema } from 'src/stock/entities/stock.entity';

@Module({
  exports: [SubsidiaryService],
  imports: [
    DatabaseModule.forFeature([
      { name: Subsidiary.name, schema: SubsidiarySchema },
      { name: Stock.name, schema: StockSchema },
    ]),
    ProductModule,
    forwardRef(() => SubsidiaryCategoryModule),
  ],
  providers: [SubsidiaryResolver, SubsidiaryService, SubsidiaryRepository],
})
export class SubsidiaryModule {}
