import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FindManyOutput } from 'src/common/dtos/find-many.output';

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

@ObjectType()
export class StocksStateOutput extends FindManyOutput {
  @Field(() => [StockStateOutput])
  data: StockStateOutput[];
}
