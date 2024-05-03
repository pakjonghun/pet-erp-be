import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateFactoryInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
