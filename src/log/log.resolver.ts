import { AuthRoleEnum } from './../users/entities/user.entity';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { LogService } from './log.service';
import { Log } from './entities/log.entity';
import { CreateLogDTO } from './dto/create-log.input';
import { Roles } from 'src/common/decorators/role.decorator';
import { FindLogsDTO } from './dto/find-log.input';
import { FindLogsResponseDTO } from './dto/find-log.output';

@Resolver(() => Log)
export class LogResolver {
  constructor(private readonly logService: LogService) {}

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Log)
  createLog(@Args('createLogInput') createLogInput: CreateLogDTO) {
    return this.logService.create(createLogInput);
  }

  @Roles([AuthRoleEnum.ADMIN, AuthRoleEnum.MANAGER])
  @Query(() => FindLogsResponseDTO, { name: 'logs' })
  findMany(@Args('findLogsQuery') query: FindLogsDTO) {
    return this.logService.findMany(query);
  }
}
