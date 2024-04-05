import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { LogService } from './log.service';
import { Log } from './entities/log.entity';
import { CreateLogDTO } from './dto/create-log.input';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRoleEnum } from 'src/users/entities/user.entity';

@Resolver(() => Log)
export class LogResolver {
  constructor(private readonly logService: LogService) {}

  @Roles([UserRoleEnum.ANY])
  @Mutation(() => Log)
  createLog(@Args('createLogInput') createLogInput: CreateLogDTO) {
    return this.logService.create(createLogInput);
  }

  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MANAGER])
  @Query(() => [Log], { name: 'logs' })
  findAll() {
    return this.logService.findAll();
  }

  @Roles([UserRoleEnum.ADMIN])
  @Mutation(() => Log)
  removeLog(@Args('_id') _id: string) {
    return this.logService.remove(_id);
  }
}
