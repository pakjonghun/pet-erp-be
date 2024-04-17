import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Category } from '../entities/category.entity';

@ObjectType()
export class CategoriesOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [Category])
  data: Category[];
}
