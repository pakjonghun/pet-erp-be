import { IsObjectId } from 'src/common/validations/id.validation';
import { CreateAdInput } from './create-ad.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateAdInput extends PartialType(CreateAdInput) {
  @Field(() => String)
  @IsObjectId({ message: '올바른 형식의 공장 아이디를 입력하세요.' })
  _id: string;
}
