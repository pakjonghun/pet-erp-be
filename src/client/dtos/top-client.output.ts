import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TopClientOutput {
  @Field(() => String)
  name: string;

  @Field(() => Int)
  accPayCost: number;

  @Field(() => Int)
  accProfit: number;

  @Field(() => Int)
  accCount: number;
}
