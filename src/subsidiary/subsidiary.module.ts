import { DatabaseModule } from './../common/database/database.module';
import { Module, forwardRef } from '@nestjs/common';
import { SubsidiaryService } from './subsidiary.service';
import { SubsidiaryResolver } from './subsidiary.resolver';
import { Subsidiary, SubsidiarySchema } from './entities/subsidiary.entity';
import {
  SubsidiaryCategory,
  SubsidiaryCategorySchema,
} from './entities/subsidiary-category.entity';
import { SubsidiaryRepository } from './subsidiary.repository';
import { SubsidiaryCategoryRepository } from './subsidiary-category.repository';
import { ProductModule } from 'src/product/product.module';
import { AppModule } from 'src/app.module';

@Module({
  imports: [
    DatabaseModule.forFeature([
      { name: Subsidiary.name, schema: SubsidiarySchema },
      { name: SubsidiaryCategory.name, schema: SubsidiaryCategorySchema },
    ]),
    ProductModule,
    forwardRef(() => AppModule),
  ],
  providers: [
    SubsidiaryResolver,
    SubsidiaryService,
    SubsidiaryRepository,
    SubsidiaryCategoryRepository,
  ],
})
export class SubsidiaryModule {}
