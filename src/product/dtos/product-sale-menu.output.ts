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

  @Field(() => Float, { nullable: true })
  accDeliveryCost: number;

  @Field(() => Float, { nullable: true })
  accTotalPayment: number;

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

  @Field(() => Int, { nullable: true })
  prevAccTotalPayment: number;

  @Field(() => Float, { nullable: true })
  prevAccDeliveryCost: number;
}

@ObjectType()
export class ProductSaleMenuOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [ProductSaleMenu])
  data: ProductSaleMenu[];
}
