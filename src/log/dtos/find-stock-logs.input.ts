import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { Field, InputType, OmitType } from '@nestjs/graphql';
import { IsDateValidate } from 'src/common/validations/date.validation';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class FindStockLogs extends OmitType(FindManyDTO, ['order', 'sort']) {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '제품 코드를 입력하세요.' })
  productCode: string;

  @Field(() => Date)
  @IsDateValidate({ message: '검색 시작날짜에 올바른 날짜를 입력해주세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '검색 종료날짜에 올바른 날짜를 입력해주세요.' })
  to: Date;
}
