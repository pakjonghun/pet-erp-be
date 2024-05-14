import { Module, forwardRef } from '@nestjs/common';
import { SubsidiaryCategoryService } from './subsidiary-category.service';
import { SubsidiaryCategoryResolver } from './subsidiary-category.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { ProductModule } from 'src/product/product.module';
import {
  SubsidiaryCategory,
  SubsidiaryCategorySchema,
} from './entities/subsidiary-category.entity';
import { SubsidiaryCategoryRepository } from './subsidiary-category.repository';
import { SubsidiaryModule } from 'src/subsidiary/subsidiary.module';

@Module({
  exports: [SubsidiaryCategoryService],
  imports: [
    DatabaseModule.forFeature([
      { name: SubsidiaryCategory.name, schema: SubsidiaryCategorySchema },
    ]),
    ProductModule,
    forwardRef(() => SubsidiaryModule),
  ],
  providers: [
    SubsidiaryCategoryResolver,
    SubsidiaryCategoryService,
    SubsidiaryCategoryRepository,
  ],
})
export class SubsidiaryCategoryModule {}
