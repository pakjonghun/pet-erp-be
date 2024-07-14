import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateValidate } from '../validations/date.validation';
import { Min } from 'class-validator';

@InputType()
export class FindDateScrollInput {
  @Field(() => Date)
  @IsDateValidate({ message: '날짜 형식을 입력해주세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '날짜 형식을 입력해주세요.' })
  to: Date;

  @Field(() => Int)
  @Min(0, { message: '0 이상의 숫자를 skip 값으로 입력하세요' })
  skip: number;

  @Field(() => Int)
  @Min(0, { message: '0 이상의 숫자를 limit 값으로 입력하세요' })
  limit: number;
}
