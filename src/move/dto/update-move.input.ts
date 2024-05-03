import { CreateMoveInput } from './create-move.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateMoveInput extends PartialType(CreateMoveInput) {
  @Field(() => Int)
  id: number;
}
