import { ObjectId } from 'mongodb';
import { CreateWholeSaleInput } from './create-whole-sale.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsObjectId } from 'src/common/validations/id.validation';

@InputType()
export class UpdateWholeSaleInput extends PartialType(CreateWholeSaleInput) {
  @IsObjectId({ message: '올바른 도매 판매 아이디를 입력해주세요.' })
  @Field(() => String)
  _id: number;
}
