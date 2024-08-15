import { Field, InputType } from '@nestjs/graphql';
import { IsDateValidate } from 'src/common/validations/date.validation';
import { IsOptional } from 'class-validator';

@InputType()
export class AdsTotalInput {
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;
}
