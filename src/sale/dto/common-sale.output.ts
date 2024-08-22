import { Field, Int, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class CommonSaleByMall {
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
export class CommonSaleByMallOutput {
  @Field(() => String)
  _id: string;

  @Field(() => [CommonSaleByMall], { nullable: true })
  products?: CommonSaleByMall[];
}
