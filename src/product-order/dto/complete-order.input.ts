import { IsObjectId } from 'src/common/validations/id.validation';
import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CompleteOrderInput {
  @Field(() => String)
  @IsObjectId({ message: '올바른 형식의 발주 아이를 입력하세요.' })
  _id: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '창고 이름을 입력해주세요.' })
  storageName: string;
}
