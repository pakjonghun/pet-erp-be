import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { Ad } from '../entities/ad.entity';
import { Field, ObjectType, OmitType } from '@nestjs/graphql';
import { Product } from 'src/product/entities/product.entity';
import { Client } from 'src/client/entities/client.entity';

@ObjectType()
export class AdsOutPutItem extends OmitType(Ad, [
  'clientCode',
  'productCodeList',
]) {
  @Field(() => [Product], { nullable: true })
  productCodeList: Product[];

  @Field(() => Client, { nullable: true })
  clientCode: Client;
}

@ObjectType()
export class AdsOutput extends FindManyOutput {
  @Field(() => [Ad])
  data: Ad[];
}
