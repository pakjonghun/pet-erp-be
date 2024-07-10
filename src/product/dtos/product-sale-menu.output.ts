import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';

@ObjectType()
export class ClientInfoMenu {
  @Field(() => Int, { nullable: true })
  accCount: number;

  @Field(() => String, { nullable: true })
  name: string;
}

@ObjectType()
export class ProductSaleMenu extends Product {
  @Field(() => Int, { nullable: true })
  accPayCost: number;

  @Field(() => Int, { nullable: true })
  accWonCost: number;

  @Field(() => Int, { nullable: true })
  accCount: number;

  @Field(() => Int, { nullable: true })
  accProfit: number;

  @Field(() => Float, { nullable: true })
  profitRate: number;

  @Field(() => Int, { nullable: true })
  stock: number;

  @Field(() => String)
  recentCreateDate: string;

  @Field(() => [ClientInfoMenu])
  clients: ClientInfoMenu[];

  @Field(() => Int, { nullable: true })
  prevAccCount: number;

  @Field(() => Int, { nullable: true })
  prevAccPayCost: number;

  @Field(() => Int, { nullable: true })
  prevAccWonCost: number;

  @Field(() => Int, { nullable: true })
  prevAccProfit: number;

  @Field(() => Float, { nullable: true })
  prevAccProfitRate: number;

  @Field(() => Float, { nullable: true })
  deliveryCost: number;

  @Field(() => Float, { nullable: true })
  prevDeliveryCost: number;
}

@ObjectType()
export class ProductSaleMenuOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [ProductSaleMenu])
  data: ProductSaleMenu[];
}
