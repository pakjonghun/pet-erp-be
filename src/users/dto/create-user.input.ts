import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { IsOneOf } from 'src/common/validations/enum.validation';
import { UserInterface, UserRoleEnum } from '../entities/user.entity';

@InputType()
export class CreateUserInput implements UserInterface {
  @Field()
  @IsNotEmpty({ message: '아이디를 입력해주세요.' })
  id: string;

  @Field()
  @IsOneOf(UserRoleEnum, { message: '올바른 유저 역할을 입력해주세요.' })
  role: UserRoleEnum;

  @Field()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;
}
