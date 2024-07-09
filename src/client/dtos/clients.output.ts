import { Field, Int, ObjectType, OmitType } from '@nestjs/graphql';
import { Client } from '../entities/client.entity';

@ObjectType()
export class ProductCodeName {
  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;
}

@ObjectType()
export class OutClient extends OmitType(Client, [
  'deliveryFreeProductCodeList',
  'deliveryNotFreeProductCodeList',
]) {
  @Field(() => [ProductCodeName], { nullable: true })
  deliveryFreeProductCodeList?: ProductCodeName[];

  @Field(() => [ProductCodeName], { nullable: true })
  deliveryNotFreeProductCodeList?: ProductCodeName[];
}

@ObjectType()
export class ClientsOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [OutClient])
  data: OutClient[];
}
