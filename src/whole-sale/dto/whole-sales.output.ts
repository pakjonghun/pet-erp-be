import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WholeSaleProduct {
  @Field(() => String)
  code: string;

  @Field(() => Int)
  count: number;

  @Field(() => String)
  productName?: string;

  @Field(() => String)
  productCode?: string;
}

@ObjectType()
export class WholeSaleOutput {
  @Field(() => String)
  _id: string;

  @Field(() => [WholeSaleProduct])
  productList: WholeSaleProduct[];

  @Field(() => String, { nullable: true })
  address1?: string;

  @Field(() => String, { nullable: true })
  telephoneNumber1?: string;

  @Field(() => Date, { nullable: true })
  saleAt?: Date;

  @Field(() => Int, { nullable: true })
  payCost?: number;

  @Field(() => String, { nullable: true })
  mallId?: string;

  @Field(() => Int, { nullable: true })
  wonCost?: number;

  @Field(() => Int, { nullable: true })
  deliveryCost?: number;

  @Field(() => Int)
  count: number;
}
