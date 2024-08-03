import { Field, Float, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Client } from '../entities/client.entity';

@ObjectType()
class ProductSaleInfo {
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

  @Field(() => String)
  name: string;
}

@ObjectType()
export class ClientSaleMenu extends PickType(Client, [
  '_id',
  'code',
  'feeRate',
  'name',
  'clientType',
  'businessName',
  'businessNumber',
  'inActive',
  'payDate',
  'isSabangService',
]) {
  @Field(() => ProductSaleInfo, { nullable: true })
  monthSales?: ProductSaleInfo;

  @Field(() => Int, { nullable: true })
  accPayCost: number;

  @Field(() => Int, { nullable: true })
  accWonCost: number;

  @Field(() => Int, { nullable: true })
  accCount: number;

  @Field(() => Int, { nullable: true })
  prevAccCount: number;

  @Field(() => Int, { nullable: true })
  prevAccPayCost: number;

  @Field(() => Int, { nullable: true })
  prevAccWonCost: number;

  @Field(() => Float, { nullable: true })
  prevAccDeliveryCost: number;

  @Field(() => Float, { nullable: true })
  accDeliveryCost: number;

  @Field(() => Float, { nullable: true })
  accTotalPayment: number;

  @Field(() => Float, { nullable: true })
  prevAccTotalPayment: number;

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
