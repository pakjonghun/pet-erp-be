import { Field, ObjectType } from '@nestjs/graphql';
import { UserInterface, UserRoleEnum } from '../entities/user.entity';

@ObjectType()
export class MyInfo implements Pick<UserInterface, 'id' | 'role'> {
  @Field(() => String)
  id: string;

  @Field(() => UserRoleEnum)
  role: UserRoleEnum;
}
