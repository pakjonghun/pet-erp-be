import { AuthRoleEnum } from './../users/entities/user.entity';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { LogService } from './log.service';
import { Log } from './entities/log.entity';
import { CreateLogDTO } from './dto/create-log.input';
import { Roles } from 'src/common/decorators/role.decorator';

@Resolver(() => Log)
export class LogResolver {
  constructor(private readonly logService: LogService) {}

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Log)
  createLog(@Args('createLogInput') createLogInput: CreateLogDTO) {
    return this.logService.create(createLogInput);
  }

  @Roles([AuthRoleEnum.ADMIN, AuthRoleEnum.MANAGER])
  @Query(() => [Log], { name: 'logs' })
  findAll() {
    return this.logService.findAll();
  }

  @Roles([AuthRoleEnum.ADMIN])
  @Mutation(() => Log)
  removeLog(@Args('_id') _id: string) {
    return this.logService.remove(_id);
  }
}
