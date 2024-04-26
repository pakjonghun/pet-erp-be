import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { SubsidiaryCategory } from './entities/subsidiary-category.entity';

@Injectable()
export class SubsidiaryCategoryRepository extends AbstractRepository<SubsidiaryCategory> {
  protected readonly logger = new Logger(SubsidiaryCategoryRepository.name);

  constructor(
    @InjectModel(SubsidiaryCategory.name)
    subsidiaryCategoryModel: Model<SubsidiaryCategory>,
  ) {
    super(subsidiaryCategoryModel);
  }
}
