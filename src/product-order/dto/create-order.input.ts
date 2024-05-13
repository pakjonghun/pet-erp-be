import { InputType, Int, Field } from '@nestjs/graphql';
import { IsArray, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

@InputType()
export class CreateOrderProductInput {
  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: '제품 숫자는 1 이상을 입력하세요.' })
  count: number;

  @IsString()
  @IsNotEmpty({ message: '제품 아이디를 입력하세요.' })
  @Field(() => String)
  product: string;
}

@InputType()
export class CreateOrderInput {
  @IsString()
  @IsNotEmpty({ message: '제조 공장 아이디를 입력하세요.' })
  @Field(() => String)
  factory: string;

  @Field(() => [CreateOrderProductInput])
  @IsArray({ message: '발주 제품 목록을 입력하세요.' })
  products: CreateOrderProductInput[];

  @Field(() => Int)
  @IsNumber()
  @Min(0, { message: '계약금은 0 이상을 입력하세요.' })
  payCost: number;

  @Field(() => Int)
  @IsNumber()
  @Min(0, { message: '잔금은 0 이상을 입력하세요.' })
  notPayCost: number;

  @Field(() => Int)
  @IsNumber()
  @Min(0, { message: '총 금액은 0 이상을 입력하세요.' })
  totalPayCost: number;
}
