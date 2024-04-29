import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';
import { FindManyOutput } from 'src/common/dtos/find-many.output';

@ObjectType()
export class ProductSaleOutput extends FindManyOutput {
  @Field(() => [ProductSaleData])
  data: ProductSaleData[];
}

@ObjectType()
export class ClientId {
  @Field(() => String)
  mallId: string;

  @Field(() => String)
  productCode: string;
}

@ObjectType()
export class SaleInfo {
  @Field(() => Int)
  accPayCost: number;

  @Field(() => Int)
  accCount: number;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  accProfit: number;

  @Field(() => Float)
  averagePayCost: number;
}

@ObjectType()
export class ProductSaleData extends Product {
  @Field(() => SaleInfo, { nullable: true })
  today: SaleInfo;

  @Field(() => SaleInfo, { nullable: true })
  thisWeek: SaleInfo;

  @Field(() => SaleInfo, { nullable: true })
  lastWeek: SaleInfo;

  @Field(() => SaleInfo, { nullable: true })
  thisMonth: SaleInfo;

  @Field(() => [ClientInfo])
  clients: ClientInfo[];
}

@ObjectType()
export class ClientInfo {
  @Field(() => Int)
  accPayCost: number;

  @Field(() => Int)
  accCount: number;

  @Field(() => ClientId)
  _id: ClientId;

  @Field(() => Float)
  accProfit: number;

  @Field(() => Float)
  averagePayCost: number;
}

export interface SaleInfoList {
  today: SaleInfo[];
  thisWeek: SaleInfo[];
  clients: ClientInfo[];
  lastWeek: SaleInfo[];
  thisMonth: SaleInfo[];
}

export interface SaleInfoList2 {
  sales: SaleInfo[];
  clients: ClientInfo[];
}

@ObjectType()
export class ProductSaleData2 extends Product {
  @Field(() => SaleInfo, { nullable: true })
  sales: SaleInfo;

  @Field(() => [ClientInfo])
  clients: ClientInfo[];
}

@ObjectType()
export class ProductSaleOutput2 {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [ProductSaleData2])
  data: ProductSaleData2[];
}
