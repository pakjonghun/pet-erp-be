import { Field, InputType, Int, OmitType } from '@nestjs/graphql';
import { IsDateValidate } from '../validations/date.validation';
import { FindManyDTO } from './find-many.input';
import { IsOptional } from 'class-validator';
import { IsOneOf } from '../validations/enum.validation';

const order = {
  '1': 1,
  '-1': -1,
};

@InputType()
export class FindDateScrollInput extends OmitType(FindManyDTO, [
  'sort',
  'order',
]) {
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
