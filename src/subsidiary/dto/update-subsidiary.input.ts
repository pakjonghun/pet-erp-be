import { CreateSubsidiaryInput } from './create-subsidiary.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateSubsidiaryInput extends PartialType(CreateSubsidiaryInput) {
  @Field(() => Int)
  id: number;
}
