import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsNumber, Max, Min } from 'class-validator';

@InputType()
export class SetDeliveryCostInput {
  @Field(() => Int)
  @IsNumber()
  @Min(1000, { message: '연도는 1000 이상의 숫자를 입력하세요.' })
  @Max(2500, { message: '연도는 2500 이하의 숫자를 입력하세요.' })
  year: number;

  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: '월은 1 이상의 숫자를 입력하세요.' })
  @Max(12, { message: '월은 12 이하의 숫자를 입력하세요.' })
  month: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0, { message: '월 택배비용은 0 이상의 숫자를 입력하세요,.' })
  monthDeliveryPayCost: number;
}
