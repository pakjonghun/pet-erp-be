import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User, AuthRoleEnum } from './entities/user.entity';
import { CreateUserDTO } from './dto/create.user.dto';
import { UpdateProfileDTO, UpdateUserDTO } from './dto/update.user.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { GetUser } from 'src/common/decorators/user.decorator';
import { MyInfo } from './dto/myInfo.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Roles([AuthRoleEnum.ADMIN])
  @Mutation(() => User)
  @LogData({ description: '회원가입', logType: LogTypeEnum.CREATE })
  async createUser(@Args('createUserInput') createUserInput: CreateUserDTO) {
    return this.usersService.create(createUserInput);
  }

  @Roles([AuthRoleEnum.ADMIN])
  @Query(() => [User], { name: 'users' })
  findAll(@GetUser() user: MyInfo) {
    return this.usersService.findAll({ id: { $ne: user.id } });
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => User, { name: 'user' })
  findOne(@Args('_id') _id: string) {
    return this.usersService.findOne(_id);
  }

  @Roles([AuthRoleEnum.ADMIN])
  @Mutation(() => User)
  @LogData({ description: '계정정보 수정', logType: LogTypeEnum.UPDATE })
  updateUser(@Args('updateUserInput') body: UpdateUserDTO) {
    return this.usersService.update(body);
  }

  @Roles([AuthRoleEnum.ADMIN])
  @Mutation(() => User)
  @LogData({ description: '프로필 수정', logType: LogTypeEnum.UPDATE })
  updateProfile(
    @Args('updateProfileInput') body: UpdateProfileDTO,
    @GetUser() user: MyInfo,
  ) {
    return this.usersService.update({ id: user.id, ...body });
  }

  @Roles([AuthRoleEnum.ADMIN])
  @LogData({ description: '계정삭제', logType: LogTypeEnum.DELETE })
  @Mutation(() => User)
  removeUser(@Args('_id') _id: string) {
    return this.usersService.remove(_id);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => MyInfo, { name: 'myInfo' })
  getMyInfo(@GetUser() user: Pick<User, 'id' | 'role'>) {
    return user;
  }
}
