import { CreateLogDTO } from './dtos/create-log.input';
import { LogRepository } from './log.repository';
import { Injectable } from '@nestjs/common';
import { FindLogsDTO } from './dtos/find-log.input';
import { ClientSession, FilterQuery } from 'mongoose';
import { Log } from './entities/log.entity';
import { UtilService } from 'src/util/util.service';

@Injectable()
export class LogService {
  constructor(
    private readonly logRepository: LogRepository,
    private readonly utilService: UtilService,
  ) {}

  create(createLogInput: CreateLogDTO) {
    return this.logRepository.create(createLogInput);
  }

  bulkWrite(logs: CreateLogDTO[], session: ClientSession) {
    const logDocs = logs.map((log) => new this.logRepository.model(log));
    return this.logRepository.bulkWrite(logDocs, session);
  }

  findMany({ keyword, keywordTarget, from, to, ...query }: FindLogsDTO) {
    const filterQuery: FilterQuery<Log> = {
      [keywordTarget]: {
        $regex: this.utilService.escapeRegex(keyword),
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
