import { Field, InputType, OmitType } from '@nestjs/graphql';
import { IsDateValidate } from '../validations/date.validation';
import { FindManyDTO } from './find-many.input';

@InputType()
export class FindDateScrollInput extends OmitType(FindManyDTO, [
  'order',
  'sort',
]) {
  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;
}
