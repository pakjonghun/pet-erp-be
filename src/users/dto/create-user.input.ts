import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @Field()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;
}
