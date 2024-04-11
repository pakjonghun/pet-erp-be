import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Log } from './entities/log.entity';
import { FilterQuery, Model } from 'mongoose';
import { FindLogsDTO } from './dto/find-log.input';
import { OrderEnum } from 'src/common/dtos/findMany.DTO';
import * as dayjs from 'dayjs';

@Injectable()
export class LogRepository extends AbstractRepository<Log> {
  protected readonly logger = new Logger(LogRepository.name);
  constructor(@InjectModel(Log.name) model: Model<Log>) {
    super(model);
  }

  async findMany({
    skip,
    limit,
    keyword,
    keywordTarget,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    from = dayjs().startOf('month').startOf('date').toDate(),
    to = dayjs().endOf('month').endOf('date').toDate(),
  }: FindLogsDTO) {
    const filter: FilterQuery<Log> = {
      [keywordTarget]: { $regex: keyword, $options: 'i' },
      createdAt: {
        $gte: from,
        $lte: to,
      },
    };

    const orderNumber = order === OrderEnum.DESC ? -1 : 1;
    const totalCount = await this.model.countDocuments(filter);
    const data = await this.model
      .find(filter)
      .sort({ [sort]: orderNumber })
      .skip(skip)
      .limit(limit)
      .lean<Log[]>();

    return { totalCount, data };
  }
}
