import { DatabaseModule } from './../common/database/database.module';
import { Module } from '@nestjs/common';
import { SubsidiaryService } from './subsidiary.service';
import { SubsidiaryResolver } from './subsidiary.resolver';
import { Subsidiary, SubsidiarySchema } from './entities/subsidiary.entity';
import {
  SubsidiaryCategory,
  SubsidiaryCategorySchema,
} from './entities/subsidiary-category.entity';
import { SubsidiaryRepository } from './subsidiary.repository';
import { SubsidiaryCategoryRepository } from './subsidiary-category.repository';

@Module({
  imports: [
    DatabaseModule.forFeature([
      { name: Subsidiary.name, schema: SubsidiarySchema },
      { name: SubsidiaryCategory.name, schema: SubsidiaryCategorySchema },
    ]),
  ],
  providers: [
    SubsidiaryResolver,
    SubsidiaryService,
    SubsidiaryRepository,
    SubsidiaryCategoryRepository,
  ],
})
export class SubsidiaryModule {}
