import { Field, Int, ObjectType, PartialType, PickType } from '@nestjs/graphql';
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
export class SaleOrdersOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [OutSaleOrdersItem], { nullable: true })
  data: OutSaleOrdersItem[];
}
