import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductSaleChartOutput {
  @Field(() => Date)
  _id: Date;

  @Field(() => Int, { nullable: true })
  accPayCost: number;

  @Field(() => Int, { nullable: true })
  accProfit: number;
}
