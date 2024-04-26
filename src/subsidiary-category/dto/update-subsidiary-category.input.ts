import { IsObjectId } from 'src/common/validations/id.validation';
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { CreateSubsidiaryCategoryInput } from './create-subsidiary-category.input';

@InputType()
export class UpdateSubsidiaryCategoryInput extends PartialType(
  CreateSubsidiaryCategoryInput,
) {
  @Field(() => String)
  @IsObjectId({
    message: '업데이트 할 부자재의 분류 아이디를 objectId 로 입력해주세요.',
  })
  _id: Types.ObjectId;
}
