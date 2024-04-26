import { Field, ObjectType } from '@nestjs/graphql';
import { ProductCategory } from '../entities/product-category.entity';
import { FindManyOutput } from 'src/common/dtos/find-many.output';

@ObjectType()
export class CategoriesOutput extends FindManyOutput {
  @Field(() => [ProductCategory])
  data: ProductCategory[];
}
