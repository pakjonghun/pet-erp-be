import { DatabaseModule } from './../common/database/database.module';
import { Module, forwardRef } from '@nestjs/common';
import { SubsidiaryService } from './subsidiary.service';
import { SubsidiaryResolver } from './subsidiary.resolver';
import { Subsidiary, SubsidiarySchema } from './entities/subsidiary.entity';
import { SubsidiaryRepository } from './subsidiary.repository';
import { ProductModule } from 'src/product/product.module';
import { AppModule } from 'src/app.module';
import { SubsidiaryCategoryModule } from 'src/subsidiary-category/subsidiary-category.module';

@Module({
  exports: [SubsidiaryService],
  imports: [
    DatabaseModule.forFeature([
      { name: Subsidiary.name, schema: SubsidiarySchema },
    ]),
    ProductModule,
    SubsidiaryCategoryModule,
    forwardRef(() => AppModule),
  ],
  providers: [SubsidiaryResolver, SubsidiaryService, SubsidiaryRepository],
})
export class SubsidiaryModule {}
