import { CreateFactoryInput } from './create-factory.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateFactoryInput extends PartialType(CreateFactoryInput) {
  @Field(() => Int)
  id: number;
}
