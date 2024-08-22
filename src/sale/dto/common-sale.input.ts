import { Field, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { IsDateValidate } from 'src/common/validations/date.validation';

@InputType()
export class CommonSaleByMallInput {
  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  mallIdList: string[];
}
