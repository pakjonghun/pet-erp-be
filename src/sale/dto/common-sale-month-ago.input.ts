import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { IsDateValidate } from 'src/common/validations/date.validation';

@InputType()
export class CommonSaleMonthAgoInput {
  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => String)
  @IsString()
  mallId: string;
}
