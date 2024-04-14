import { Field, Float, Int, ObjectType, OmitType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';

@ObjectType()
export class ProductSaleOutput {
  @Field(() => Int)
  totalCount: number;

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
export class ProductSaleData extends OmitType(Product, ['wonPrice']) {
  @Field(() => SaleInfo, { nullable: true })
  today: SaleInfo;

  @Field(() => SaleInfo, { nullable: true })
  thisWeek: SaleInfo;

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
}
