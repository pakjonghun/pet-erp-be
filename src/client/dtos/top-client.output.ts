import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TopClientOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [TopClientData])
  data: TopClientData[];
}

@ObjectType()
export class TopClientData {
  @Field(() => String)
  name: string;

  @Field(() => Int)
  accPayCost: number;

  @Field(() => Int)
  accProfit: number;

  @Field(() => Int)
  accCount: number;
}
