import { IsObjectId } from 'src/common/validations/id.validation';
import { CreateOrderInput } from './create-order.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateOrderInput extends PartialType(CreateOrderInput) {
  @Field(() => String)
  @IsObjectId({ message: '올바른 형식의 발주 아이를 입력하세요.' })
  _id: string;
}
