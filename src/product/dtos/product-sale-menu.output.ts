import { Field, Float, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';

@ObjectType()
export class ClientInfoMenu {
  @Field(() => Int, { nullable: true })
  accCount: number;

  @Field(() => Int, { nullable: true })
  accPayCost: number;

  @Field(() => Int, { nullable: true })
  accWonCost: number;

  @Field(() => Float, { nullable: true })
  accDeliveryCost: number;

  @Field(() => Float, { nullable: true })
  accTotalPayment: number;

  @Field(() => String, { nullable: true })
  name: string;
}

@ObjectType()
export class ProductSaleMenu extends PickType(Product, [
  '_id',
  'code',
  'barCode',
  'name',
  'wonPrice',
  'leadTime',
  'salePrice',
  'isFreeDeliveryFee',
]) {
  @Field(() => Int, { nullable: true })
  stock: number;

  @Field(() => String)
  recentCreateDate: string;

  @Field(() => Int, { nullable: true })
  accPayCost: number;

  @Field(() => Int, { nullable: true })
  accWonCost: number;

  @Field(() => Int, { nullable: true })
  accCount: number;

  // @Field(() => Int, { nullable: true })
  // prevAccCount: number;

  // @Field(() => Int, { nullable: true })
  // prevAccPayCost: number;

  // @Field(() => Int, { nullable: true })
  // prevAccWonCost: number;

  // @Field(() => Float, { nullable: true })
  // prevAccDeliveryCost: number;

  // @Field(() => Float, { nullable: true })
  // prevAccTotalPayment: number;

  @Field(() => Float, { nullable: true })
  accProfit: number;

  @Field(() => Float, { nullable: true })
  accProfitRate: number;

  @Field(() => Float, { nullable: true })
  accDeliveryCost: number;

  @Field(() => Float, { nullable: true })
  accTotalPayment: number;

  @Field(() => [ClientInfoMenu])
  clients: ClientInfoMenu[];
}

@ObjectType()
export class ProductSaleMenuOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [ProductSaleMenu])
  data: ProductSaleMenu[];
}
