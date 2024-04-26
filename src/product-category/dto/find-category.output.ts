import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProductCategory } from '../entities/product-category.entity';

@ObjectType()
export class CategoriesOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [ProductCategory])
  data: ProductCategory[];
}
