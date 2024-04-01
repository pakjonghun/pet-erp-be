import { InputType, Field } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsNumber()
  email: string;

  @Field()
  password: string;
}
