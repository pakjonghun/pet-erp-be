import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Product } from 'src/product/entities/product.entity';
import { Storage } from 'src/storage/entities/storage.entity';

@ObjectType()
export class TotalProductStockOutput {
  @Field(() => String)
  _id: string;

  @Field(() => Product)
  product: Product;

  @Field(() => Storage, { nullable: true })
  storage: Storage;

  @Field(() => Int, { nullable: true })
  storageCount: number;

  @Field(() => Int, { nullable: true })
  orderCount: number;

  @Field(() => Int, { nullable: true })
  recentSaleCount: number;
}
