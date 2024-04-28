import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { LogInterface } from '../entities/log.entity';
import { Field, InputType } from '@nestjs/graphql';
import { IsOneOf } from 'src/common/validations/enum.validation';
import { IsDateValidate } from 'src/common/validations/date.validation';

const log: Record<keyof LogInterface, keyof LogInterface> = {
  description: 'description',
  logType: 'logType',
  userId: 'userId',
};

@InputType()
export class FindLogsDTO extends FindManyDTO {
  @Field(() => String)
  @IsOneOf(log, { message: '검색할수 없는 키워드 입니다.' })
  keywordTarget: keyof LogInterface;

  @Field(() => Date)
  @IsDateValidate({ message: '검색 시작날짜에 올바른 날짜를 입력해주세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '검색 종료날짜에 올바른 날짜를 입력해주세요.' })
  to: Date;
}
