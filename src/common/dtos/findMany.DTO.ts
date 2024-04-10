import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { IsOneOf } from '../validations/enum.validation';

export enum OrderEnum {
  'ASC' = 'ASC',
  'DESC' = 'DESC',
}

registerEnumType(OrderEnum, {
  name: 'Order',
});

@InputType()
export class FindManyDTO {
  @Field(() => String)
  @IsString()
  keyword: string;

  @Field(() => Int)
  @IsNumber()
  offset: number;

  @Field(() => Int)
  @IsNumber()
  skip: number;

  @Field(() => OrderEnum, { nullable: true })
  @IsOptional()
  @IsOneOf(OrderEnum, { message: '정렬 순서를 입력해주세요' })
  order: OrderEnum;

  @Field(() => String, { nullable: true })
  @IsOptional()
  sort?: string;
}
