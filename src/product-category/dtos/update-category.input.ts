import { IsObjectId } from 'src/common/validations/id.validation';
import { CreateCategoryInput } from './create-category.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
  @Field(() => String)
  @IsObjectId({ message: '올바른 형식의 카테고리 아이디를 입력해주세요.' })
  _id: string;
}
