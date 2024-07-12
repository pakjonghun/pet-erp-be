import { AuthRoleEnum } from './../users/entities/user.entity';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { LogService } from './log.service';
import { Log } from './entities/log.entity';
import { CreateLogDTO } from './dtos/create-log.input';
import { Roles } from 'src/common/decorators/role.decorator';
import { FindLogsDTO } from './dtos/find-log.input';
import { FindLogsResponseDTO } from './dtos/find-log.output';
import { FindStockLogs } from './dtos/find-stock-logs.input';

@Resolver(() => Log)
export class LogResolver {
  constructor(private readonly logService: LogService) {}

  @Roles([AuthRoleEnum.ADMIN_LOG])
  @Mutation(() => Log)
  createLog(@Args('createLogInput') createLogInput: CreateLogDTO) {
    return this.logService.create(createLogInput);
  }

  @Roles([AuthRoleEnum.ADMIN_LOG])
  @Query(() => FindLogsResponseDTO, { name: 'logs' })
  findMany(@Args('findLogsQuery') query: FindLogsDTO) {
    return this.logService.findMany(query);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => FindLogsResponseDTO, { name: 'stockLogs' })
  stockLogs(@Args('findStockLogs') query: FindStockLogs) {
    return this.logService.findStockLogs(query);
  }
}
