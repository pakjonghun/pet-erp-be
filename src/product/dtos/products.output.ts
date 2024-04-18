import { Field, Int, ObjectType, OmitType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';

@ObjectType()
export class ProductsOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [ProductOutput])
  data: ProductOutput[];
}

@ObjectType()
export class NullableCategory {
  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  name?: string;
}

@ObjectType()
export class ProductOutput extends OmitType(Product, ['category']) {
  @Field(() => NullableCategory, { nullable: true })
  category?: NullableCategory;
}
