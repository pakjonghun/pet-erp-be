import { CreateLogDTO } from './dtos/create-log.input';
import { LogRepository } from './log.repository';
import { Injectable } from '@nestjs/common';
import { FindLogsDTO } from './dtos/find-log.input';
import { ClientSession, FilterQuery } from 'mongoose';
import { Log, LogInterface, LogTypeEnum } from './entities/log.entity';
import { UtilService } from 'src/util/util.service';

export type CreateStockLogInput = {
  userId: string;
  logType: LogTypeEnum;
  storageName: string;
  productName: string;
  count: number;
  action?: '입고' | '출고';
};

export type BulkWriteLogInput = {
  logs: CreateLogDTO[];
  session: ClientSession;
};

@Injectable()
export class LogService {
  constructor(
    private readonly logRepository: LogRepository,
    private readonly utilService: UtilService,
  ) {}

  create(createLogInput: CreateLogDTO) {
    return this.logRepository.create(createLogInput);
  }

  bulkCreate({ logs, session }: BulkWriteLogInput) {
    const logDocs = logs.map((log) => {
      return new this.logRepository.model(log);
    });
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

  createStockLog({
    userId,
    logType,
    storageName,
    productName,
    count,
    action = '출고',
  }: CreateStockLogInput) {
    const log: LogInterface = {
      userId,
      logType,
      description: `${storageName} 창고에서 ${productName} 제품을 ${count}개 ${action}함`,
    };

    return log;
  }
}
