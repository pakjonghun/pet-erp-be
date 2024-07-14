import { IsArray, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { OptionInterface } from '../entities/option.entity';
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateOptionInput implements OptionInterface {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '옵션 아이디를 입력하세요.' })
  id: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '옵션 이름을 입력하세요.' })
  name: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: '제품에 적용될 숫자를 1이상의 값을 입력하세요.' })
  count: number;

  @IsArray()
  @IsString({ each: true, message: '제품 코드는 문자 타입으로 입력해주세요.' })
  @Field(() => [String])
  productCodeList: string[];
}
