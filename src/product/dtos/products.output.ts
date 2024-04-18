import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';

@ObjectType()
export class ProductsOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [Product])
  data: Product[];
}
