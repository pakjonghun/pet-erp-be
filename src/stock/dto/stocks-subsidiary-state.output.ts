import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SubsidiaryStockStateOutput {
  @Field(() => String)
  productName: string;

  @Field(() => String)
  location: string;

  @Field(() => Int)
  count: number;

  @Field(() => String)
  state: string;
}
