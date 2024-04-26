import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FindManyOutput {
  @Field(() => Int)
  totalCount: number;
}
