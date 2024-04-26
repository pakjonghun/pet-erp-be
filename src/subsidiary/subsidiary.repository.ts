import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Subsidiary } from './entities/subsidiary.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FindManyInput } from 'src/common/database/types';
import { OrderEnum } from 'src/common/dtos/find-many.input';

@Injectable()
export class SubsidiaryRepository extends AbstractRepository<Subsidiary> {
  protected readonly logger = new Logger(SubsidiaryRepository.name);

  constructor(
    @InjectModel(Subsidiary.name) subsidiaryModel: Model<Subsidiary>,
  ) {
    super(subsidiaryModel);
  }

  findFullManySubsidiary({
    filterQuery,
    limit,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    skip,
  }: FindManyInput<Subsidiary>) {
    const orderNumber = order === OrderEnum.DESC ? -1 : 1;
    return this.model
      .find(filterQuery)
      .sort({ [sort]: orderNumber, _id: 1 })
      .limit(limit)
      .skip(skip)
      .populate({ path: 'productList' })
      .populate({ path: 'category' })
      .lean<Subsidiary[]>();
  }
}
