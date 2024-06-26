import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StockStateOutput {
  @Field(() => String)
  productName: string;

  @Field(() => String)
  location: string;

  @Field(() => Int)
  count: number;

  @Field(() => String)
  state: string;

  @Field(() => String, { nullable: true })
  orderCompleteDate: string;
}
