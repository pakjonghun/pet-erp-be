import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  OptionInterface,
  OptionProductInterface,
} from '../entities/option.entity';
import { InputType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';

@InputType()
export class OptionProductInput implements OptionProductInterface {
  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: '제품 숫자는 1보다 큰 숫자를 입력하세요' })
  count: number;

  @Field(() => String)
  @IsString()
  productCode: string;
}

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

  @Field(() => [OptionProductInput])
  @IsArray({ message: '제품옵션은 배열을 입력하세요.' })
  @ArrayNotEmpty({ message: '1개 이상의 제품옵션을 입력하세요.' })
  @Type(() => OptionProductInput)
  @ValidateNested({ each: true })
  productOptionList: OptionProductInput[];
}
