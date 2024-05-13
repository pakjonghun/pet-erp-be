import { IsObjectId } from 'src/common/validations/id.validation';
import { CreateStorageInput } from './create-storage.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateStorageInput extends PartialType(CreateStorageInput) {
  @Field(() => String)
  @IsObjectId({ message: '올바른 형식의 창고 아이디를 입력하세요.' })
  _id: string;
}
