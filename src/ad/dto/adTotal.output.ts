import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdTotalOutput {
  @Field(() => Float)
  accPrice: number;
}
