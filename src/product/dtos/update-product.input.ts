import { IsObjectId } from 'src/common/validations/id.validation';
import { CreateProductInput } from './create-product.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field(() => String)
  @IsObjectId({ message: '상품의 아이디 형식이 맞지 않습니다.' })
  _id: string;
}
