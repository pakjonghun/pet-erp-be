import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { Ad } from '../entities/ad.entity';
import { Field, ObjectType, OmitType } from '@nestjs/graphql';
import { ProductCodeName } from 'src/client/dtos/clients.output';

@ObjectType()
export class AdsOutPutItem extends OmitType(Ad, [
  'clientCode',
  'productCodeList',
]) {
  @Field(() => [ProductCodeName], { nullable: true })
  productCodeList: ProductCodeName[];

  @Field(() => ProductCodeName, { nullable: true })
  clientCode: ProductCodeName;
}

@ObjectType()
export class AdsOutput extends FindManyOutput {
  @Field(() => [AdsOutPutItem])
  data: AdsOutPutItem[];
}
