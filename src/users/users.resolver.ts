import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User, AuthRoleEnum } from './entities/user.entity';
import { CreateUserDTO } from './dtos/create-user.input';
import { UpdateProfileDTO, UpdateUserDTO } from './dtos/update-user.input';
import { Roles } from 'src/common/decorators/role.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { GetUser } from 'src/common/decorators/user.decorator';
import { MyInfo } from './dtos/myInfo.output';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Roles([AuthRoleEnum.ADMIN_ACCOUNT])
  @Mutation(() => User)
  @LogData({ description: '회원가입', logType: LogTypeEnum.CREATE })
  async createUser(@Args('createUserInput') createUserInput: CreateUserDTO) {
    return this.usersService.create(createUserInput);
  }

  @Roles([AuthRoleEnum.ADMIN_ACCOUNT])
  @Query(() => [User], { name: 'users' })
  findAll(@GetUser() user: User) {
    return this.usersService.findAll({ id: { $ne: user.id } });
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => User, { name: 'user' })
  findOne(@Args('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles([AuthRoleEnum.ADMIN_ACCOUNT])
  @Mutation(() => User)
  @LogData({ description: '계정정보 수정', logType: LogTypeEnum.UPDATE })
  async updateUser(@Args('updateUserInput') body: UpdateUserDTO) {
    const { id, role, createdAt } = await this.usersService.update(body);
    return { id, role, createdAt };
  }

  @Roles([AuthRoleEnum.ADMIN_ACCOUNT])
  @Mutation(() => User)
  @LogData({ description: '계정정보 수정', logType: LogTypeEnum.UPDATE })
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

  @Roles([AuthRoleEnum.ADMIN_ACCOUNT])
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
