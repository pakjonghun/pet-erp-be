import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';

@ObjectType()
export class ClientId {
  @Field(() => String)
  mallId: string;

  @Field(() => String)
  productCode: string;
}

@ObjectType()
export class SaleInfo {
  @Field(() => Int, { nullable: true })
  accPayCost: number;

  @Field(() => Int, { nullable: true })
  accCount: number;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => Float, { nullable: true })
  accProfit: number;

  @Field(() => Float, { nullable: true })
  averagePayCost: number;

  _id: string;
}

@ObjectType()
export class TotalSaleInfo {
  @Field(() => SaleInfo, { nullable: true })
  current: SaleInfo;

  @Field(() => SaleInfo, { nullable: true })
  previous: SaleInfo;
}

@ObjectType()
export class SaleInfos {
  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => Int, { nullable: true })
  accPayCost: number;

  @Field(() => Int, { nullable: true })
  accCount: number;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => Float, { nullable: true })
  accProfit: number;

  @Field(() => Float, { nullable: true })
  averagePayCost: number;

  @Field(() => Int, { nullable: true })
  prevAccPayCost: number;

  @Field(() => Int, { nullable: true })
  prevAccCount: number;

  @Field(() => Float, { nullable: true })
  prevAccProfit: number;

  @Field(() => Float, { nullable: true })
  prevAveragePayCost: number;
}

@ObjectType()
export class DashboardResult {
  @Field(() => [SaleInfos], { nullable: true })
  data?: SaleInfos[];

  @Field(() => Int, { nullable: true })
  totalCount: number;
}

@ObjectType()
export class ClientInfo {
  @Field(() => Int, { nullable: true })
  accPayCost: number;

  @Field(() => Int, { nullable: true })
  accCount: number;

  @Field(() => ClientId, { nullable: true })
  _id: ClientId;

  @Field(() => Float, { nullable: true })
  accProfit: number;

  @Field(() => Float, { nullable: true })
  averagePayCost: number;
}

export interface SaleInfoList {
  clients: ClientInfo[];
  sales: SaleInfo[];
}

@ObjectType()
export class ProductSaleData extends Product {
  @Field(() => SaleInfos, { nullable: true })
  sales: SaleInfos;

  @Field(() => [ClientInfo])
  clients: ClientInfo[];

  @Field(() => Int)
  stock: number;

  @Field(() => String, { nullable: true })
  recentCreateDate: string;
}
