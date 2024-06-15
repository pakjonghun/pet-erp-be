import { Field, InputType } from '@nestjs/graphql';
import { IsDateValidate } from '../validations/date.validation';
import { IsArray, IsOptional, IsString } from 'class-validator';

@InputType()
export class FindDateInput {
  @Field(() => Date)
  @IsDateValidate({ message: '날짜 형식을 입력해주세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '날짜 형식을 입력해주세요.' })
  to: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productCodeList?: string[];
}
