import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Client } from '../entities/client.entity';
@ObjectType()
export class ClientsOutput {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [Client])
  data: Client[];
}
