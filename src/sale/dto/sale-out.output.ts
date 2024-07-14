import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SaleOutOutput {
  @Field(() => String, { nullable: true })
  hasNoCountSale?: string;

  @Field(() => String, { nullable: true })
  hasNoProductCodeSale?: string;

  @Field(() => String, { nullable: true })
  hasNoMatchClientSale?: string;

  @Field(() => String, { nullable: true })
  hasNoMatchStorageSale?: string;

  @Field(() => String, { nullable: true })
  hasNoStockSale?: string;

  @Field(() => String, { nullable: true })
  hasNoMatchStorageProductStockSale?: string;

  @Field(() => String, { nullable: true })
  totalErrors?: string;
}
