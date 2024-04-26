import { IsObjectId } from 'src/common/validations/id.validation';
import { CreateSubsidiaryInput } from './create-subsidiary.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { Types } from 'mongoose';

@InputType()
export class UpdateSubsidiaryInput extends PartialType(CreateSubsidiaryInput) {
  @Field(() => String)
  @IsObjectId({
    message: '업데이트 할 부자재의 아이디를 objectId 로 입력해주세요.',
  })
  _id: Types.ObjectId;
}
