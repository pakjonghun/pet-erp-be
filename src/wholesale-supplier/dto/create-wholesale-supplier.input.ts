import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateWholesaleSupplierInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
