import { Field, InputType, Int, OmitType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { IsDateValidate } from 'src/common/validations/date.validation';
import { IsOneOf } from 'src/common/validations/enum.validation';

const order = {
  '1': 1,
  '-1': -1,
};

@InputType()
export class ProductSaleInput extends OmitType(FindManyDTO, ['order', 'sort']) {
  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsOneOf(order, { message: 'order는 1 이나 -1 중에 입력하세요.' })
  order?: 1 | -1;

  @Field(() => String, { nullable: true })
  @IsOptional()
  sort?: string;
}
