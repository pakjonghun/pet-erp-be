import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateStorageInput {
  @Field(() => Int)
  exampleField: number;
}
