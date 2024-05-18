import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class DeliveryCostOutput {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field(() => Float)
  deliveryCost: number;
}
