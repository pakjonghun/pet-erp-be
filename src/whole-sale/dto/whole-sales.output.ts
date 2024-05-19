import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FindManyOutput } from 'src/common/dtos/find-many.output';

@ObjectType()
export class WholeSaleProduct {
  @Field(() => String)
  storageName: string;

  @Field(() => String)
  productName: string;

  @Field(() => String)
  productCode: string;

  @Field(() => Int)
  count: number;

  @Field(() => Int)
  payCost: number;

  @Field(() => Int, { nullable: true })
  wonCost?: number;
}

@ObjectType()
export class WholeSaleItem {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  mallId: string;

  @Field(() => Date)
  saleAt: Date;

  @Field(() => String, { nullable: true })
  telephoneNumber1?: string;

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  totalWonCost: number;

  @Field(() => Int)
  totalPayCost: number;

  @Field(() => Boolean, { nullable: true })
  isDone: boolean;

  @Field(() => [WholeSaleProduct])
  productList: WholeSaleProduct[];
}

@ObjectType()
export class WholeSaleOutput extends FindManyOutput {
  @Field(() => [WholeSaleItem])
  data: WholeSaleItem[];
}
