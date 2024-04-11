import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User, AuthRoleEnum } from './entities/user.entity';
import { CreateUserDTO } from './dto/create.user.dto';
import { UpdateProfileDTO, UpdateUserDTO } from './dto/update.user.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { GetUser } from 'src/common/decorators/user.decorator';
import { MyInfo } from './dto/myInfo.dto';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Roles([AuthRoleEnum.ADMIN])
  @Mutation(() => User)
  @LogData({ description: '회원가입', logType: LogTypeEnum.CREATE })
  async createUser(@Args('createUserInput') createUserInput: CreateUserDTO) {
    return this.usersService.create(createUserInput);
  }

  @Roles([AuthRoleEnum.ADMIN])
  @Query(() => [User], { name: 'users' })
  findAll(@GetUser() user: User) {
    return this.usersService.findAll({ id: { $ne: user.id } });
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => User, { name: 'user' })
  findOne(@Args('id') id: string) {
    return this.usersService.findOne(id);
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
  async updateProfile(
    @Args('updateProfileInput') body: UpdateProfileDTO,
    @GetUser() user: MyInfo,
    @Context() context: any,
  ) {
    const res = context.res as Response;
    const newUser = await this.usersService.update({ id: user.id, ...body });
    await this.authService.login(newUser, res);
    const { id } = newUser;
    return { id, ...body };
  }
  //

  @Roles([AuthRoleEnum.ADMIN])
  @LogData({ description: '계정삭제', logType: LogTypeEnum.DELETE })
  @Mutation(() => User)
  removeUser(@Args('id') id: string) {
    return this.usersService.remove(id);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => MyInfo, { name: 'myInfo' })
  getMyInfo(@GetUser() user: User) {
    return user;
  }
}
