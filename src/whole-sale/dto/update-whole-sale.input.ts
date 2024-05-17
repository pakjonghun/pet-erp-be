import { CreateWholeSaleInput } from './create-whole-sale.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class UpdateWholeSaleInput extends CreateWholeSaleInput {
  @IsNotEmpty({ message: '도매 판매 아이디를 입력하세요.' })
  @IsString()
  @Field(() => String)
  wholeSaleId: string;
}
