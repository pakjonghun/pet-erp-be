import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FindManyOutput } from 'src/common/dtos/find-many.output';

@ObjectType()
export class SubsidiaryStockColumn {
  @Field(() => String)
  productName: string;

  @Field(() => String)
  stockCount: string;

  @Field(() => Int, { nullable: true })
  leadTime?: number;

  @Field(() => Int, { nullable: true })
  wonPrice?: number;

  @Field(() => [String], { nullable: true })
  productList?: string[];
}

@ObjectType()
export class SubsidiaryStocksOutput extends FindManyOutput {
  @Field(() => [SubsidiaryStockColumn])
  data: SubsidiaryStockColumn[];
}
