import { Field, InputType, PickType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { IsDateValidate } from 'src/common/validations/date.validation';

@InputType()
export class WholeSalesInput extends PickType(FindManyDTO, [
  'limit',
  'skip',
  'keyword',
]) {
  @Field(() => Date, { nullable: true })
  @IsDateValidate({ message: '올바른 날짜형식을 입력해주세요.' })
  from: Date;

  @Field(() => Date, { nullable: true })
  @IsDateValidate({ message: '올바른 날짜형식을 입력해주세요.' })
  to: Date;
}
