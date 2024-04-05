import { IsObjectId } from 'src/common/validations/id.validation';
import { CreateUserInput } from './create-user.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field()
  @IsObjectId({ message: '올바른 objectId 를 입력해주세요.' })
  _id: string;
}
