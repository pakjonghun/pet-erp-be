import { Field, InputType, Int } from '@nestjs/graphql';
import { Min } from 'class-validator';

@InputType()
export class TopClientInput {
  @Field(() => Int)
  @Min(1, { message: '1개 이상의 노출할 데이터 숫자를 입력하세요.' })
  limit: number;
}
