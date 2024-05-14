import { Field, ObjectType } from '@nestjs/graphql';
import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { ProductOrder } from '../entities/product-order.entity';

@ObjectType()
export class ProductOrderOutput extends FindManyOutput {
  @Field(() => [ProductOrder])
  data: ProductOrder[];
}
