import { CreateOptionInput } from './create-option.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class UpdateOptionInput extends PartialType(CreateOptionInput) {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '옵션의 아이디를 입력하세요.' })
  id: string;
}
