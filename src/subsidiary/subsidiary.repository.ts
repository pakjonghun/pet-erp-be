import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Subsidiary } from './entities/subsidiary.entity';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
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

  async findFullManySubsidiary({
    filterQuery,
    limit,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    skip,
  }: FindManyInput<Subsidiary>) {
    const totalCount = await this.model.countDocuments(filterQuery);
    const orderNumber = order === OrderEnum.DESC ? -1 : 1;
    const subsidiaries = await this.model
      .find(filterQuery)
      .populate({ path: 'productList' })
      .populate({ path: 'category' })
      .sort({ [sort]: orderNumber, _id: 1 })
      .limit(limit)
      .skip(skip)
      .lean<Subsidiary[]>();
    return {
      totalCount,
      data: subsidiaries,
    };
  }

  async findFullSubsidiary(filterQuery: FilterQuery<Subsidiary>) {
    const result = await this.model
      .findOne(filterQuery)
      .populate({ path: 'productList' })
      .populate({ path: 'category' })
      .lean<Subsidiary>();

    if (!result) {
      throw new NotFoundException(
        `검색결과가 존재하지 않습니다. ${filterQuery}`,
      );
    }

    return result;
  }
}
