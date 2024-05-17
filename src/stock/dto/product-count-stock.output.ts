import { Field, Int, ObjectType, PickType } from '@nestjs/graphql';
import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { Product } from 'src/product/entities/product.entity';

@ObjectType()
export class ProductCountColumn extends PickType(Product, ['name']) {
  @Field(() => Int)
  count: number;
}

@ObjectType()
export class ProductCountStocksOutput extends FindManyOutput {
  @Field(() => [ProductCountColumn])
  data: ProductCountColumn[];
}
