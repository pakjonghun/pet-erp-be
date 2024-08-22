import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class CommonSaleByMallMonthAgoOutput {
  @Field(() => String)
  _id: string;

  @Field(() => Float, { nullable: true })
  accPayCost: number;

  @Field(() => Float, { nullable: true })
  accWonCost: number;

  @Field(() => Float, { nullable: true })
  accCount: number;

  @Field(() => Float, { nullable: true })
  accDeliveryCost: number;

  @Field(() => Float, { nullable: true })
  accTotalPayment: number;
}
