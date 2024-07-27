import { Field, InputType, OmitType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { IsDateValidate } from 'src/common/validations/date.validation';

@InputType()
export class ProductSaleInput extends OmitType(FindManyDTO, ['order', 'sort']) {
  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;
}
