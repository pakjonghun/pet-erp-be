import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Client } from '../entities/client.entity';

@ObjectType()
class ProductSaleInfo {
  @Field(() => Int, { nullable: true })
  accCount: number;

  @Field(() => String)
  name: string;
}

@ObjectType()
export class ClientSaleMenu extends Client {
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
  prevAccCount: number;

  @Field(() => Int, { nullable: true })
  prevAccPayCost: number;

  @Field(() => Int, { nullable: true })
  prevAccWonCost: number;

  @Field(() => Int, { nullable: true })
  prevAccProfit: number;

  @Field(() => Float, { nullable: true })
  prevProfitRate: number;

  @Field(() => Float, { nullable: true })
  prevDeliveryCost: number;

  @Field(() => Float, { nullable: true })
  deliveryCost: number;

  @Field(() => [ProductSaleInfo])
  products: ProductSaleInfo[];
}

@ObjectType()
export class ClientSaleMenuOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [ClientSaleMenu])
  data: ClientSaleMenu[];
}
