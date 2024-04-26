import { Field, ObjectType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';
import { FindManyOutput } from 'src/common/dtos/find-many.output';

@ObjectType()
export class ProductsOutput extends FindManyOutput {
  @Field(() => [Product])
  data: Product[];
}
