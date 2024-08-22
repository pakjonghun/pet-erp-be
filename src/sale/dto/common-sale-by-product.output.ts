import { Field, Int, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class CommonSaleByProduct {
  @Field(() => String)
  name: string;

  @Field(() => Int, { nullable: true })
  accPayCost: number;

  @Field(() => Int, { nullable: true })
  accWonCost: number;

  @Field(() => Int, { nullable: true })
  accCount: number;

  @Field(() => Float, { nullable: true })
  accDeliveryCost: number;

  @Field(() => Float, { nullable: true })
  accTotalPayment: number;

  @Field(() => Float, { nullable: true })
  accAdPrice: number;
}

@ObjectType()
export class CommonSaleByProductOutput {
  @Field(() => String)
  _id: string;

  @Field(() => [CommonSaleByProduct], { nullable: true })
  clients?: CommonSaleByProduct[];
}
