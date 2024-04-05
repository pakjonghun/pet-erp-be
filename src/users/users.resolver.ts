import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User, UserRoleEnum } from './entities/user.entity';
import { CreateUserDTO } from './dto/create.user.dto';
import { UpdateUserDTO } from './dto/update.user.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { LogData } from 'src/common/decorators/log.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Roles([UserRoleEnum.ADMIN])
  @Mutation(() => User)
  @LogData({ description: '회원가입', logType: LogTypeEnum.CREATE })
  async createUser(@Args('createUserInput') createUserInput: CreateUserDTO) {
    return this.usersService.create(createUserInput);
  }

  @Roles([UserRoleEnum.ADMIN])
  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Roles([UserRoleEnum.ANY])
  @Query(() => User, { name: 'user' })
  findOne(@Args('_id') _id: string) {
    return this.usersService.findOne(_id);
  }

  @Roles([UserRoleEnum.ADMIN])
  @Mutation(() => User)
  @LogData({ description: '계정정보 수정', logType: LogTypeEnum.UPDATE })
  updateUser(@Args('updateUserInput') body: UpdateUserDTO) {
    return this.usersService.update(body);
  }

  @Roles([UserRoleEnum.ADMIN])
  @LogData({ description: '계정삭제', logType: LogTypeEnum.DELETE })
  @Mutation(() => User)
  removeUser(@Args('_id') _id: string) {
    return this.usersService.remove(_id);
  }
}
