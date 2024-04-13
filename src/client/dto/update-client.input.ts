import { IsObjectId } from 'src/common/validations/id.validation';
import { CreateClientInput } from './create-client.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateClientInput extends PartialType(CreateClientInput) {
  @Field(() => String)
  @IsObjectId()
  _id: string;
}
