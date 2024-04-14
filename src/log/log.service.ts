import { CreateLogDTO } from './dtos/create-log.input';
import { LogRepository } from './log.repository';
import { Injectable } from '@nestjs/common';
import { FindLogsDTO } from './dtos/find-log.input';
import { FilterQuery } from 'mongoose';
import { Log } from './entities/log.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class LogService {
  constructor(private readonly logRepository: LogRepository) {}

  create(createLogInput: CreateLogDTO) {
    return this.logRepository.create(createLogInput);
  }

  findMany({
    keyword,
    keywordTarget,
    from = dayjs().startOf('month').startOf('date').toDate(),
    to = dayjs().startOf('month').endOf('date').toDate(),
    ...query
  }: FindLogsDTO) {
    const filterQuery: FilterQuery<Log> = {
      [keywordTarget]: {
        $regex: keyword,
        $options: 'i',
      },
      createdAt: {
        $gte: from,
        $lte: to,
      },
    };

    return this.logRepository.findMany({
      ...query,
      filterQuery,
    });
  }
}
