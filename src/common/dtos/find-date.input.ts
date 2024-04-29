import { Field, InputType } from '@nestjs/graphql';
import { IsDateValidate } from '../validations/date.validation';

@InputType()
export class FindDateInput {
  @Field(() => Date)
  @IsDateValidate({ message: '날짜 형식을 입력해주세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '날짜 형식을 입력해주세요.' })
  to: Date;
}
