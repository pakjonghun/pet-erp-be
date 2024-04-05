import { Injectable } from '@nestjs/common';
import { CreateLogDTO } from './dto/create-log.input';
import { LogRepository } from './log.repository';

@Injectable()
export class LogService {
  constructor(private readonly logRepository: LogRepository) {}

  create(createLogInput: CreateLogDTO) {
    return this.logRepository.create(createLogInput);
  }

  findAll() {
    return this.logRepository.findAll({});
  }

  remove(_id: string) {
    return this.logRepository.remove({ _id });
  }
}
