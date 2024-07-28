import { Field, InputType, Int, OmitType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { IsDateValidate } from 'src/common/validations/date.validation';
import { IsOneOf } from 'src/common/validations/enum.validation';

const sort = {
  '1': 1,
  '-1': 1,
};

const order = {
  count: 1,
  totalPayment: 1,
  wonCost: 1,
  payCost: 1,
  saleAt: 1,
  productName: 1,
};

@InputType()
export class SaleOrdersInput extends OmitType(FindManyDTO, [
  'sort',
  'order',
  'keyword',
]) {
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsOneOf(order, { message: '정렬은 1 이나 -1 중에 입력하세요.' })
  order?: 1 | -1;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsOneOf(sort, { message: '올바을 sort 값을 입력하세요.' })
  sort?: keyof typeof order;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  mallId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  productName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  orderNumber?: string;
}
