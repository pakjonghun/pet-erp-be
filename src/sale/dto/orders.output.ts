import {
  Field,
  Float,
  Int,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { Sale } from '../entities/sale.entity';

@ObjectType()
export class OutSaleOrdersItem extends PartialType(
  PickType(Sale, [
    'count',
    'deliveryCost',
    'mallId',
    'orderNumber',
    'payCost',
    'productName',
    'saleAt',
    'totalPayment',
    'wonCost',
  ]),
) {}

@ObjectType()
export class OutSaleOrderItemTotal {
  @Field(() => Float)
  accCount: number;

  @Field(() => Float)
  accTotalPayment: number;

  @Field(() => Float)
  accWonCost: number;

  @Field(() => Float)
  accPayCost: number;

  @Field(() => Float)
  accDeliveryCost: number;
}

@ObjectType()
export class SaleOrdersOutput {
  @Field(() => OutSaleOrderItemTotal, { nullable: true })
  total: OutSaleOrderItemTotal;

  @Field(() => Int)
  totalCount: number;

  @Field(() => [OutSaleOrdersItem], { nullable: true })
  data: OutSaleOrdersItem[];
}
