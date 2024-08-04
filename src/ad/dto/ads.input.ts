import { Field, InputType, Int, PickType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { IsDateValidate } from 'src/common/validations/date.validation';
import { AdType } from '../entities/ad.entity';
import { IsOneOf } from 'src/common/validations/enum.validation';
import { IsOptional } from 'class-validator';

const order = {
  '1': 1,
  '-1': -1,
};

@InputType()
export class AdsInput extends PickType(FindManyDTO, [
  'keyword',
  'limit',
  'skip',
]) {
  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;

  @Field(() => AdType, { nullable: true })
  @IsOptional()
  @IsOneOf(AdType, { message: '올바른 날짜 형식을 입력하세요.' })
  type: AdType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsOneOf(order, { message: 'order는 1 이나 -1 중에 입력하세요.' })
  order?: 1 | -1;

  @Field(() => String, { nullable: true })
  @IsOptional()
  sort?: string;
}
