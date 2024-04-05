import { InputType, Field } from '@nestjs/graphql';
import { LogInterface, LogTypeEnum } from '../entities/log.entity';
import { IsOneOf } from 'src/common/validations/enum.validation';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateLogDTO implements LogInterface {
  @Field(() => LogTypeEnum)
  @IsOneOf(LogTypeEnum, { message: '올바른 로그 타입을 입력하세요.' })
  logType: LogTypeEnum;

  @Field(() => String)
  @IsNotEmpty({ message: '유저 아이디를 입력하세요.' })
  userId: string;

  @Field(() => String)
  @IsString({ message: '설명은 문자형식으로 입력하세요.' })
  description: string;
}
