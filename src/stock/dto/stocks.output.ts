import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FindManyOutput } from 'src/common/dtos/find-many.output';

@ObjectType()
export class StockColumn {
  @Field(() => String)
  productName: string;

  @Field(() => String)
  stockCount: string;

  @Field(() => Int)
  monthSaleCount: number;

  @Field(() => Int, { nullable: true })
  leadTime?: number;

  @Field(() => Int, { nullable: true })
  wonPrice?: number;

  @Field(() => Int)
  leftDate: number;
}

@ObjectType()
export class StocksOutput extends FindManyOutput {
  @Field(() => [StockColumn])
  data: StockColumn[];
}
