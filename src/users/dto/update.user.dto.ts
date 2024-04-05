import { IsObjectId } from 'src/common/validations/id.validation';
import { CreateUserDTO } from './create.user.dto';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateUserDTO extends PartialType(CreateUserDTO) {
  @Field()
  @IsObjectId({ message: '올바른 objectId 를 입력해주세요.' })
  _id: string;
}
