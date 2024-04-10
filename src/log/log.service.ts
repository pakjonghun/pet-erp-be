import { Injectable } from '@nestjs/common';
import { CreateLogDTO } from './dto/create-log.input';
import { LogRepository } from './log.repository';
import { FindLogsDTO } from './dto/find-log.input';

@Injectable()
export class LogService {
  constructor(private readonly logRepository: LogRepository) {}

  create(createLogInput: CreateLogDTO) {
    return this.logRepository.create(createLogInput);
  }

  findMany(query: FindLogsDTO) {
    return this.logRepository.findMany(query);
  }
}
