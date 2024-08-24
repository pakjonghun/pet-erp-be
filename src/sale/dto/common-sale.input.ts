import { Field, InputType } from '@nestjs/graphql';
import { IsDateValidate } from 'src/common/validations/date.validation';

@InputType()
export class CommonSaleByInput {
  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;
}
